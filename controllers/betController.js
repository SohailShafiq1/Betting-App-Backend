import Bet from '../models/Bet.js';
import Match from '../models/Match.js';
import User from '../models/User.js';

export const placeBet = async (req, res) => {
  const { amount, matchId, choice } = req.body;

  if (!amount || !matchId || !choice) {
    return res.status(400).json({ message: 'Match, choice, and amount are required' });
  }

  const stake = Number(amount);
  
  // Validate minimum bet amount
  if (stake < 5) {
    return res.status(400).json({ message: 'Minimum bet amount is 5 USD' });
  }

  if (stake <= 0) {
    return res.status(400).json({ message: 'Bet amount must be greater than zero' });
  }

  const match = await Match.findById(matchId);
  if (!match) {
    return res.status(404).json({ message: 'Match not found' });
  }

  if (!['OPEN', 'RUNNING'].includes(match.status)) {
    return res.status(400).json({ message: 'This match is not open for betting' });
  }

  if (!['A', 'B'].includes(choice)) {
    return res.status(400).json({ message: 'Invalid team choice' });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.wallet < stake) {
    return res.status(400).json({ 
      message: `Insufficient wallet balance. Available: $${user.wallet.toFixed(2)}, Required: $${stake.toFixed(2)}` 
    });
  }

  const odds = choice === 'A' ? match.oddsA : match.oddsB;
  const teamName = choice === 'A' ? match.teamAName : match.teamBName;

  // Deduct from wallet on bet placement
  user.wallet -= stake;

  await user.save();

  const bet = await Bet.create({
    user: user._id,
    match: match._id,
    choice,
    teamName,
    amount: stake,
    odds,
    result: 'PENDING',
    payout: 0,
    status: 'OPEN',
  });

  res.status(201).json({
    success: true,
    bet,
    wallet: user.wallet,
    result: bet.result,
    payout: bet.payout,
    message: 'Bet placed successfully',
  });
};

export const getUserBets = async (req, res) => {
  try {
    const bets = await Bet.find({ user: req.user._id })
      .populate('match', 'teamAName teamBName teamALogo teamBLogo oddsA oddsB')
      .sort({ createdAt: -1 });
    res.json(bets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBetById = async (req, res) => {
  try {
    const bet = await Bet.findById(req.params.id)
      .populate('match')
      .populate('user', 'name email wallet');
    
    if (!bet) {
      return res.status(404).json({ message: 'Bet not found' });
    }

    if (bet.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this bet' });
    }

    res.json(bet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const cancelBet = async (req, res) => {
  try {
    const bet = await Bet.findById(req.params.id);
    
    if (!bet) {
      return res.status(404).json({ message: 'Bet not found' });
    }

    if (bet.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this bet' });
    }

    if (bet.status !== 'OPEN') {
      return res.status(400).json({ message: 'Cannot cancel a settled bet' });
    }

    // Refund bet amount
    const user = await User.findById(req.user._id);
    user.wallet += bet.amount;
    await user.save();

    bet.status = 'CANCELLED';
    await bet.save();

    res.json({ message: 'Bet cancelled successfully', wallet: user.wallet });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
