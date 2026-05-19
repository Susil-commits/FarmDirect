import express from 'express';
import {
  startOrder,
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  addOrderReview,
  cancelOrder,
  denyOrder,
  markOrderReceived,
  getOrderStatus,
  trackOrder,
  getOrderStats,
} from '../controllers/orderController.js';
import { protect, authorize, requireKYC } from '../middleware/auth.js';

const router = express.Router();

// All order routes require authentication
router.post('/start', protect, authorize('farmer'), requireKYC, startOrder);
router.post('/', protect, authorize('buyer'), requireKYC, createOrder);
router.get('/', protect, getOrders);
router.get('/stats/summary', protect, getOrderStats);
router.get('/:id', protect, getOrderById);

// Order status management (Farmer + Admin)
router.put('/:id/status', protect, authorize('farmer', 'admin'), updateOrderStatus);

// Review (Buyer only)
router.post('/:id/review', protect, authorize('buyer'), addOrderReview);

// Cancel (Both buyer and farmer can cancel)
router.patch('/:id/cancel', protect, authorize('buyer', 'farmer', 'admin'), cancelOrder);

// Deny (Farmer rejects a cart-based order)
router.post('/:id/deny', protect, authorize('farmer'), denyOrder);

// Mark as Received (Buyer confirms receipt)
router.patch('/:id/receive', protect, authorize('buyer'), markOrderReceived);

// Tracking
router.get('/:id/status', protect, getOrderStatus);
router.get('/:id/track', protect, trackOrder);

export default router;
