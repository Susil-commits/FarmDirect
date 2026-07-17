import { Router } from 'express';
import {
  startOrder, createOrder, getOrders, getOrderById, updateOrderStatus, addOrderReview,
  cancelOrder, denyOrder, markOrderReceived, getOrderStatus, trackOrder, getOrderStats,
  markCODPaymentReceived, getCODPaymentStatus, getPendingCODPayments
} from '../controllers/orderController.js';
import { protect, authorize, requireKYC } from '../middleware/auth.js';
import { UserRole } from '../types/enums.js';

const router = Router();

router.post('/start', protect, authorize(UserRole.Farmer), requireKYC, startOrder);
router.post('/', protect, authorize(UserRole.Buyer), requireKYC, createOrder);
router.get('/', protect, getOrders);
router.get('/stats/summary', protect, getOrderStats);
router.get('/payment/pending-cod', protect, authorize(UserRole.Farmer), getPendingCODPayments);
router.get('/:id', protect, getOrderById);

// COD endpoints (Task 1.4)
router.put('/:id/payment/received', protect, authorize(UserRole.Farmer, UserRole.Admin), markCODPaymentReceived);
router.get('/:id/payment/status', protect, getCODPaymentStatus);

router.put('/:id/status', protect, authorize(UserRole.Farmer, UserRole.Admin, UserRole.Buyer), updateOrderStatus);
router.post('/:id/review', protect, authorize(UserRole.Buyer), addOrderReview);
router.patch('/:id/cancel', protect, authorize(UserRole.Buyer, UserRole.Farmer, UserRole.Admin), cancelOrder);
router.post('/:id/deny', protect, authorize(UserRole.Farmer), denyOrder);
router.patch('/:id/receive', protect, authorize(UserRole.Buyer), markOrderReceived);

router.get('/:id/status', protect, getOrderStatus);
router.get('/:id/track', protect, trackOrder);

export default router;
