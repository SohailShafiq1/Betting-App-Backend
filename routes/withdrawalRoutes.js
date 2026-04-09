import express from 'express';
import {
  createWithdrawal,
  getUserWithdrawals,
  getAllWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
} from '../controllers/withdrawalController.js';
import { protect } from '../middleware/authMiddleware.js';
import { protectAdminRole } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.post('/', protect, createWithdrawal);
router.get('/', protect, getUserWithdrawals);

router.get('/admin/all', protect, protectAdminRole, getAllWithdrawals);
router.patch('/admin/:id/approve', protect, protectAdminRole, approveWithdrawal);
router.patch('/admin/:id/reject', protect, protectAdminRole, rejectWithdrawal);

export default router;
