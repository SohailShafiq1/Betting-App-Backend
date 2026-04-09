import express from 'express';
import multer from 'multer';
import { createMatch, getMatches, deleteMatch, updateMatchStatus, setMatchResult } from '../controllers/matchController.js';
import { protect } from '../middleware/authMiddleware.js';
import { protectAdminRole } from '../middleware/adminMiddleware.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads'),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const sanitized = file.originalname.replace(/\s+/g, '-');
    cb(null, `${timestamp}-${sanitized}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});

const matchUpload = upload.fields([
  { name: 'teamALogo', maxCount: 1 },
  { name: 'teamBLogo', maxCount: 1 },
]);

router.post('/', protect, protectAdminRole, matchUpload, createMatch);
router.get('/', protect, getMatches);
router.patch('/:id/status', protect, protectAdminRole, updateMatchStatus);
router.patch('/:id/result', protect, protectAdminRole, setMatchResult);
router.delete('/:id', protect, protectAdminRole, deleteMatch);

export default router;
