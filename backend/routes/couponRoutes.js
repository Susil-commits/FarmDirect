import express from 'express';
import { validateCoupon } from '../controllers/couponController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Validate a coupon against an order subtotal (any authenticated user)
router.get('/validate', protect, validateCoupon);

export default router;
