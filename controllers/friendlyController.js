import crypto from 'crypto';
import FriendlyChallenge from '../models/FriendlyChallenge.js';
import Match from '../models/Match.js';
import User from '../models/User.js';
import Bet from '../models/Bet.js';

const generateUniqueCode = async () => {
  let code;
  let exists = true;

  while (exists) {
    code = crypto.randomBytes(4).toString('hex');
    exists = await FriendlyChallenge.findOne({ code });
  }

  return code;
};

const getOppositeChoice = (choice) => (choice === 'A' ? 'B' : 'A');

export const createFriendlyChallenge = async (req, res) => {
  try {
    const { matchId, teamName, choice, amount } = req.body;

    if (!matchId || !teamName || !choice || !amount) {
      return res.status(400).json({ message: 'Match, team name, choice, and amount are required' });
    }

    if (!['A', 'B'].includes(choice)) {
      return res.status(400).json({ message: 'Choice must be A or B' });
    }

    const stake = Number(amount);
    if (stake < 5) {
      return res.status(400).json({ message: 'Minimum bet amount is 5 USD' });
    }

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: 'Selected match not found' });
    }

    if (!['OPEN', 'RUNNING'].includes(match.status)) {
      return res.status(400).json({ message: 'This match is not open for betting' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.wallet < stake) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    const odds = choice === 'A' ? match.oddsA : match.oddsB;
    const teamLabel = choice === 'A' ? match.teamAName : match.teamBName;

    user.wallet -= stake;
    await user.save();

    const bet = await Bet.create({
      user: user._id,
      match: match._id,
      choice,
      teamName: teamLabel,
      amount: stake,
      odds,
      result: 'PENDING',
      payout: 0,
      status: 'OPEN',
    });

    const code = await generateUniqueCode();
    const challenge = await FriendlyChallenge.create({
      code,
      creator: user._id,
      creatorTeamName: teamName.trim(),
      match: match._id,
      creatorChoice: choice,
      creatorAmount: stake,
      creatorOdds: odds,
      creatorBet: bet._id,
    });

    return res.status(201).json({
      success: true,
      challenge,
      inviteCode: code,
      inviteUrl: `${req.protocol}://${req.get('host')}/friendly/${code}`,
      wallet: user.wallet,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getFriendlyChallengeByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const challenge = await FriendlyChallenge.findOne({ code })
      .populate('creator', 'name userId')
      .populate('match')
      .populate('opponent', 'name userId');

    if (!challenge) {
      return res.status(404).json({ message: 'Friendly challenge not found' });
    }

    const isCreator = challenge.creator._id.toString() === req.user._id.toString();
    const isOpponent = challenge.opponent && challenge.opponent._id.toString() === req.user._id.toString();

    res.json({
      ...challenge.toObject(),
      isCreator,
      isOpponent,
      opponentChoice: challenge.opponentChoice || getOppositeChoice(challenge.creatorChoice),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const joinFriendlyChallenge = async (req, res) => {
  try {
    const { code } = req.params;
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ message: 'Amount is required to join the challenge' });
    }

    const stake = Number(amount);
    if (stake < 5) {
      return res.status(400).json({ message: 'Minimum join amount is 5 USD' });
    }

    const challenge = await FriendlyChallenge.findOne({ code }).populate('match');
    if (!challenge) {
      return res.status(404).json({ message: 'Friendly challenge not found' });
    }

    if (challenge.status !== 'OPEN') {
      return res.status(400).json({ message: 'This friendly match is no longer open' });
    }

    if (challenge.creator.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot join your own friendly challenge' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.wallet < stake) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    const opponentChoice = getOppositeChoice(challenge.creatorChoice);
    const opponentOdds = opponentChoice === 'A' ? challenge.match.oddsA : challenge.match.oddsB;
    const opponentTeamName = opponentChoice === 'A' ? challenge.match.teamAName : challenge.match.teamBName;

    user.wallet -= stake;
    await user.save();

    const opponentBet = await Bet.create({
      user: user._id,
      match: challenge.match._id,
      choice: opponentChoice,
      teamName: opponentTeamName,
      amount: stake,
      odds: opponentOdds,
      result: 'PENDING',
      payout: 0,
      status: 'OPEN',
    });

    challenge.opponent = user._id;
    challenge.opponentChoice = opponentChoice;
    challenge.opponentAmount = stake;
    challenge.opponentOdds = opponentOdds;
    challenge.opponentBet = opponentBet._id;
    challenge.status = 'JOINED';
    await challenge.save();

    const populatedChallenge = await FriendlyChallenge.findById(challenge._id)
      .populate('creator', 'name userId')
      .populate('opponent', 'name userId')
      .populate('match');

    res.json({
      success: true,
      challenge: populatedChallenge,
      wallet: user.wallet,
      message: 'Joined friendly challenge successfully. Your friend can now bet on the opposite team.',
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getUserFriendlyChallenges = async (req, res) => {
  try {
    const challenges = await FriendlyChallenge.find({
      $or: [{ creator: req.user._id }, { opponent: req.user._id }],
    })
      .populate('creator', 'name userId')
      .populate('opponent', 'name userId')
      .populate('match')
      .sort({ createdAt: -1 });

    res.json(challenges);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
