import { Router } from 'express';
import {
  createRazorpayOrder, verifyRazorpayPayment, markRazorpayPaymentFailed,
  handleRazorpayWebhook,
} from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/auth.js';
import { UserRole } from '../types/enums.js';

const router = Router();

// Public webhook endpoints verified via HMAC-SHA256 signature
router.post('/webhook', handleRazorpayWebhook);
router.post('/razorpay/webhook', handleRazorpayWebhook);

router.post('/razorpay/init', protect, authorize(UserRole.Buyer), createRazorpayOrder);
router.post('/razorpay/verify', protect, authorize(UserRole.Buyer), verifyRazorpayPayment);
router.post('/razorpay/failed', protect, authorize(UserRole.Buyer), markRazorpayPaymentFailed);

export default router;
