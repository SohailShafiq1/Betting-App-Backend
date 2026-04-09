import Withdrawal from '../models/Withdrawal.js';
import User from '../models/User.js';

export const createWithdrawal = async (req, res) => {
  try {
    const { amount, method, reason, bank, coin } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Withdrawal amount is required' });
    }

    if (!['BANK', 'COIN'].includes(method)) {
      return res.status(400).json({ message: 'Invalid withdrawal method' });
    }

    if (method === 'BANK') {
      if (!bank?.bankName || !bank?.accountNumber || !bank?.accountName) {
        return res.status(400).json({ message: 'Bank name, account number, and account name are required' });
      }
    }

    if (method === 'COIN') {
      if (!coin?.network || !coin?.trcId) {
        return res.status(400).json({ message: 'Coin network and TRC ID are required' });
      }
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const requestedAmount = Number(amount);
    if (user.wallet < requestedAmount) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    const withdrawal = await Withdrawal.create({
      userId: user._id,
      amount: requestedAmount,
      method,
      reason: reason || '',
      bank: method === 'BANK' ? {
        bankName: bank.bankName,
        accountNumber: bank.accountNumber,
        accountName: bank.accountName,
      } : undefined,
      coin: method === 'COIN' ? {
        network: coin.network,
        trcId: coin.trcId,
      } : undefined,
      status: 'PENDING',
    });

    res.status(201).json({ success: true, withdrawal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, withdrawals });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find()
      .populate('userId', 'name email wallet')
      .sort({ createdAt: -1 });
    res.json({ success: true, withdrawals });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const approveWithdrawal = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'PENDING') {
      return res.status(400).json({ message: 'Withdrawal already processed' });
    }

    const user = await User.findById(withdrawal.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.wallet < withdrawal.amount) {
      return res.status(400).json({ message: 'Insufficient user wallet balance' });
    }

    user.wallet -= withdrawal.amount;
    await user.save();

    withdrawal.status = 'APPROVED';
    withdrawal.approvedAt = new Date();
    await withdrawal.save();

    res.json({ success: true, withdrawal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const rejectWithdrawal = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'PENDING') {
      return res.status(400).json({ message: 'Withdrawal already processed' });
    }

    withdrawal.status = 'REJECTED';
    await withdrawal.save();

    res.json({ success: true, withdrawal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
