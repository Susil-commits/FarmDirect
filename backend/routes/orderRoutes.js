import express from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  addOrderReview,
} from '../controllers/orderController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All order routes require authentication
router.post('/', protect, createOrder);
router.get('/my-orders', protect, getOrders); // Get current user's orders
router.get('/', protect, getOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, updateOrderStatus);
router.post('/:id/review', protect, addOrderReview);

export default router;
