import { Router } from 'express';
import {
  createRazorpayOrder, verifyRazorpayPayment, markRazorpayPaymentFailed,
  handleRazorpayWebhook,
} from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/auth.js';
import { UserRole } from '../types/enums.js';
import validateRequest from '../middleware/validator.js';
import {
  createRazorpayOrderSchema,
  verifyRazorpayPaymentSchema,
  markRazorpayPaymentFailedSchema,
} from '../schemas/paymentSchemas.js';

const router = Router();

// Public webhook endpoints verified via HMAC-SHA256 signature
router.post('/webhook', handleRazorpayWebhook);
router.post('/razorpay/webhook', handleRazorpayWebhook);

router.post('/razorpay/init', protect, authorize(UserRole.Buyer), validateRequest({ body: createRazorpayOrderSchema }), createRazorpayOrder);
router.post('/razorpay/verify', protect, authorize(UserRole.Buyer), validateRequest({ body: verifyRazorpayPaymentSchema }), verifyRazorpayPayment);
router.post('/razorpay/failed', protect, authorize(UserRole.Buyer), validateRequest({ body: markRazorpayPaymentFailedSchema }), markRazorpayPaymentFailed);

export default router;
