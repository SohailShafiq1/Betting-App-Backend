import User from '../models/User.js';
import Bet from '../models/Bet.js';
import FriendlyChallenge from '../models/FriendlyChallenge.js';

export const getAdminStats = async (req, res) => {
  const userCount = await User.countDocuments({ role: 'user' });
  const adminCount = await User.countDocuments({ role: 'admin' });
  const walletTotal = await User.aggregate([
    { $match: { role: 'user' } },
    { $group: { _id: null, total: { $sum: '$wallet' } } },
  ]);

  res.json({
    userCount,
    adminCount,
    walletTotal: walletTotal[0]?.total || 0,
    currentAdmin: {
      id: req.user._id,
      email: req.user.email,
    },
  });
};

export const getOpenBets = async (req, res) => {
  try {
    const filter = req.query.filter;
    let query = { status: 'OPEN' };

    if (filter === 'win-loss') {
      query = { result: { $in: ['WIN', 'LOSE'] } };
    }

    const bets = await Bet.find(query)
      .populate('user', 'name email')
      .populate('match', 'teamAName teamBName status oddsA oddsB')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: bets.length, data: bets });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFriendlyBets = async (req, res) => {
  try {
    const challenges = await FriendlyChallenge.find()
      .populate('creator', 'name email')
      .populate('opponent', 'name email')
      .populate('match', 'teamAName teamBName status oddsA oddsB')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: challenges.length, data: challenges });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getActiveUsers = async (req, res) => {
  const users = await User.find({ role: 'user' })
    .select('-password')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
};
