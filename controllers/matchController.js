import Match from '../models/Match.js';
import Tournament from '../models/Tournament.js';
import Bet from '../models/Bet.js';
import User from '../models/User.js';

export const createMatch = async (req, res) => {
  try {
    const { tournament, teamAName, teamBName, oddsA, oddsB, matchDate, matchTime } = req.body;

    // Validation
    if (!tournament || !teamAName || !teamBName || !oddsA || !oddsB || !matchDate || !matchTime) {
      return res.status(400).json({
        message: 'Tournament, both team names, odds, match date and time are required',
      });
    }

    // Check if tournament exists
    const tournamentExists = await Tournament.findById(tournament);
    if (!tournamentExists) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    const match = await Match.create({
      tournament,
      teamAName,
      teamBName,
      oddsA: Number(oddsA),
      oddsB: Number(oddsB),
      matchDate: new Date(matchDate),
      matchTime,
      teamALogo: req.files?.teamALogo?.[0]
        ? `/uploads/${req.files.teamALogo[0].filename}`
        : undefined,
      teamBLogo: req.files?.teamBLogo?.[0]
        ? `/uploads/${req.files.teamBLogo[0].filename}`
        : undefined,
    });

    // Increment tournament match count
    tournamentExists.matchCount = (tournamentExists.matchCount || 0) + 1;
    await tournamentExists.save();

    // Populate tournament data
    const populatedMatch = await match.populate('tournament');

    res.status(201).json(populatedMatch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMatches = async (req, res) => {
  try {
    const matches = await Match.find().populate('tournament').sort({ createdAt: -1 });
    res.json(matches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMatchStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['OPEN', 'RUNNING', 'FINISHED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid match status' });
    }

    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    match.status = status;
    await match.save();

    res.json(match);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const setMatchResult = async (req, res) => {
  try {
    const { result } = req.body;
    if (!['A', 'B'].includes(result)) {
      return res.status(400).json({ message: 'Result must be A or B' });
    }

    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    match.result = result;
    match.status = 'FINISHED';
    await match.save();

    const openBets = await Bet.find({ match: match._id, status: 'OPEN' });
    if (openBets.length === 0) {
      return res.json({ match, settled: 0 });
    }

    const updates = [];
    const userWalletUpdates = new Map();

    for (const bet of openBets) {
      const isWin = bet.choice === result;
      const payout = isWin ? bet.amount * bet.odds : 0;

      bet.result = isWin ? 'WIN' : 'LOSE';
      bet.payout = payout;
      bet.status = 'SETTLED';
      updates.push(bet.save());

      if (isWin) {
        const current = userWalletUpdates.get(String(bet.user)) || 0;
        userWalletUpdates.set(String(bet.user), current + payout);
      }
    }

    await Promise.all(updates);

    const walletPromises = Array.from(userWalletUpdates.entries()).map(([userId, amount]) =>
      User.findByIdAndUpdate(userId, { $inc: { wallet: amount } })
    );
    await Promise.all(walletPromises);

    res.json({ match, settled: openBets.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteMatch = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Decrement tournament match count
    const tournament = await Tournament.findById(match.tournament);
    if (tournament) {
      tournament.matchCount = Math.max(0, (tournament.matchCount || 1) - 1);
      await tournament.save();
    }

    await match.deleteOne();
    res.json({ message: 'Match deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
