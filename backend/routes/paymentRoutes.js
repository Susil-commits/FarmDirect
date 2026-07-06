import express from 'express';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  markRazorpayPaymentFailed,
} from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All payment routes require an authenticated buyer
router.post('/razorpay/init', protect, authorize('buyer'), createRazorpayOrder);
router.post('/razorpay/verify', protect, authorize('buyer'), verifyRazorpayPayment);
router.post('/razorpay/failed', protect, authorize('buyer'), markRazorpayPaymentFailed);

export default router;
