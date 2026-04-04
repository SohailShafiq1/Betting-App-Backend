import express from 'express';
import {
  getAllTournaments,
  getTournament,
  createTournament,
  updateTournament,
  deleteTournament,
  getTournamentMatches,
} from '../controllers/tournamentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { protectAdminRole } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.get('/', getAllTournaments);
router.get('/:id', getTournament);
router.get('/:id/matches', getTournamentMatches);
router.post('/', protect, protectAdminRole, createTournament);
router.put('/:id', protect, protectAdminRole, updateTournament);
router.delete('/:id', protect, protectAdminRole, deleteTournament);

export default router;
