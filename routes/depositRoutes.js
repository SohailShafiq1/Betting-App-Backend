import express from 'express';
import {
  createCheckoutSession,
  createPaymentIntent,
  createCryptoDeposit,
  approveManualDeposit,
  rejectManualDeposit,
  testConfirmDeposit,
  handleStripeWebhook,
  getDepositHistory,
  getDepositById,
  getDepositStatus,
  getAllDeposits,
} from '../controllers/depositController.js';
import multer from 'multer';
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

/**
 * Public webhook route (no auth required)
 * Must be before express.json() middleware in server.js
 */
router.post('/webhook', handleStripeWebhook);

/**
 * Protected user routes
 */
router.post('/create-payment-intent', protect, createPaymentIntent);
router.post('/create-checkout-session', protect, createCheckoutSession);
router.post('/crypto', protect, upload.single('proof'), createCryptoDeposit);
router.post('/test-confirm/:depositId', protect, testConfirmDeposit);
router.get('/', protect, getDepositHistory);

/**
 * Admin routes
 */
router.get('/admin/all', protect, protectAdminRole, getAllDeposits);
router.patch('/admin/:id/approve-manual', protect, protectAdminRole, approveManualDeposit);
router.patch('/admin/:id/reject-manual', protect, protectAdminRole, rejectManualDeposit);

router.get('/:depositId', protect, getDepositById);
router.get('/:depositId/status', protect, getDepositStatus);

export default router;
