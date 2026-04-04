import express from 'express';
import {
  createCheckoutSession,
  createPaymentIntent,
  testConfirmDeposit,
  handleStripeWebhook,
  getDepositHistory,
  getDepositById,
  getDepositStatus,
  getAllDeposits,
} from '../controllers/depositController.js';
import { protect } from '../middleware/authMiddleware.js';
import { protectAdminRole } from '../middleware/adminMiddleware.js';

const router = express.Router();

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
router.post('/test-confirm/:depositId', protect, testConfirmDeposit);
router.get('/', protect, getDepositHistory);
router.get('/:depositId', protect, getDepositById);
router.get('/:depositId/status', protect, getDepositStatus);

/**
 * Admin routes
 */
router.get('/admin/all', protect, protectAdminRole, getAllDeposits);

export default router;
