import User from '../models/User.js';

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
