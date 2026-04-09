import express from 'express';
import { placeBet, getUserBets, getBetById, cancelBet } from '../controllers/betController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, placeBet);
router.get('/', protect, getUserBets);
router.get('/:id', protect, getBetById);
router.delete('/:id', protect, cancelBet);

export default router;
