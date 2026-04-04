import Match from '../models/Match.js';
import Tournament from '../models/Tournament.js';

export const createMatch = async (req, res) => {
  try {
    const { tournament, teamAName, teamBName, oddsA, oddsB } = req.body;

    // Validation
    if (!tournament || !teamAName || !teamBName || !oddsA || !oddsB) {
      return res.status(400).json({
        message: 'Tournament and both team names with odds are required',
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
