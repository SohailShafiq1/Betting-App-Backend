import Bet from '../models/Bet.js';
import Settings from '../models/Settings.js';
import Match from '../models/Match.js';
import User from '../models/User.js';

export const placeBet = async (req, res) => {
  const { amount, matchId, choice } = req.body;

  if (!amount || !matchId || !choice) {
    return res.status(400).json({ message: 'Match, choice, and amount are required' });
  }

  const stake = Number(amount);
  if (stake <= 0) {
    return res.status(400).json({ message: 'Bet amount must be greater than zero' });
  }

  const match = await Match.findById(matchId);
  if (!match) {
    return res.status(404).json({ message: 'Match not found' });
  }

  if (!['A', 'B'].includes(choice)) {
    return res.status(400).json({ message: 'Invalid team choice' });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.wallet < stake) {
    return res.status(400).json({ message: 'Insufficient wallet balance' });
  }

  const settings = (await Settings.findOne()) || (await Settings.create({}));
  const odds = choice === 'A' ? match.oddsA : match.oddsB;
  const winChance = settings.winRate;

  user.wallet -= stake;

  const isWin = Math.random() * 100 < winChance;
  const payout = isWin ? stake * odds : 0;
  if (isWin) {
    user.wallet += payout;
  }

  await user.save();

  const bet = await Bet.create({
    user: user._id,
    match: match._id,
    choice,
    amount: stake,
    odds,
    result: isWin ? 'WIN' : 'LOSE',
    payout,
  });

  res.status(201).json({
    success: true,
    bet,
    wallet: user.wallet,
    result: bet.result,
    payout: bet.payout,
  });
};

export const getUserBets = async (req, res) => {
  const bets = await Bet.find({ user: req.user._id })
    .populate('match', 'teamAName teamBName teamALogo teamBLogo oddsA oddsB')
    .sort({ createdAt: -1 });
  res.json(bets);
};
