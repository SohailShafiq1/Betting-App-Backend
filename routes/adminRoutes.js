import express from 'express';
import { getAdminStats, getActiveUsers, getOpenBets, getFriendlyBets } from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { protectAdminRole } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.get('/stats', protect, protectAdminRole, getAdminStats);
router.get('/users', protect, protectAdminRole, getActiveUsers);
router.get('/open-bets', protect, protectAdminRole, getOpenBets);
router.get('/friendly-bets', protect, protectAdminRole, getFriendlyBets);

export default router;
