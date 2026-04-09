import express from 'express';
import { getSettings, getPublicSettings, updateSettings } from '../controllers/settingsController.js';
import { protect } from '../middleware/authMiddleware.js';
import { protectAdminRole } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.get('/public', getPublicSettings);
router.get('/', protect, protectAdminRole, getSettings);
router.put('/', protect, protectAdminRole, updateSettings);

export default router;
