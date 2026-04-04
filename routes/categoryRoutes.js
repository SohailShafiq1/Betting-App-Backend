import express from 'express';
import multer from 'multer';
import {
  getAllCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryTournaments,
} from '../controllers/categoryController.js';
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

router.get('/', getAllCategories);
router.get('/:id', getCategory);
router.get('/:id/tournaments', getCategoryTournaments);
router.post('/', protect, protectAdminRole, upload.single('logo'), createCategory);
router.put('/:id', protect, protectAdminRole, upload.single('logo'), updateCategory);
router.delete('/:id', protect, protectAdminRole, deleteCategory);

export default router;
