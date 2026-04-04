import express from 'express';
import { placeBet, getUserBets } from '../controllers/betController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, placeBet);
router.get('/', protect, getUserBets);

export default router;
