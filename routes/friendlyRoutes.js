import express from 'express';
import {
  createFriendlyChallenge,
  getFriendlyChallengeByCode,
  joinFriendlyChallenge,
  getUserFriendlyChallenges,
} from '../controllers/friendlyController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createFriendlyChallenge);
router.get('/my', protect, getUserFriendlyChallenges);
router.get('/:code', protect, getFriendlyChallengeByCode);
router.post('/:code/join', protect, joinFriendlyChallenge);

export default router;
