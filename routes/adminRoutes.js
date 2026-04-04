import express from 'express';
import { getAdminStats } from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { protectAdminRole } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.get('/stats', protect, protectAdminRole, getAdminStats);

export default router;
