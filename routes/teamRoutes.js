import express from 'express';
import multer from 'multer';
import { createTeam, getTeams, deleteTeam } from '../controllers/teamController.js';
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

router.post('/', protect, protectAdminRole, upload.single('logo'), createTeam);
router.get('/', protect, getTeams);
router.delete('/:id', protect, protectAdminRole, deleteTeam);

export default router;
