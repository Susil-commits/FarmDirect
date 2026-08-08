import { Router } from 'express';
import {
  startOrder, createOrder, checkoutCart, getOrders, getOrderById, updateOrderStatus, addOrderReview,
  cancelOrder, denyOrder, markOrderReceived, getOrderStatus, trackOrder, getOrderStats,
  markCODPaymentReceived, getCODPaymentStatus, getPendingCODPayments
} from '../controllers/orderController.js';
import { protect, authorize, requireKYC } from '../middleware/auth.js';
import validateRequest, { validateObjectId } from '../middleware/validator.js';
import { trimStrings } from '../middleware/sanitizer.js';
import { UserRole } from '../types/enums.js';
import { idempotency } from '../middleware/idempotency.js';
import { updateOrderStatusSchema, cancelOrderSchema, orderQuerySchema } from '../schemas/orderSchemas.js';

const router = Router();

router.post('/start', protect, authorize(UserRole.Farmer), requireKYC, trimStrings, startOrder);
router.post('/checkout-cart', protect, authorize(UserRole.Buyer), requireKYC, trimStrings, idempotency, checkoutCart);
router.post('/', protect, authorize(UserRole.Buyer), requireKYC, trimStrings, idempotency, createOrder);
router.get('/', protect, validateRequest({ query: orderQuerySchema }), getOrders);
router.get('/stats/summary', protect, getOrderStats);
router.get('/payment/pending-cod', protect, authorize(UserRole.Farmer), getPendingCODPayments);

router.get('/:id', validateObjectId(), protect, getOrderById);

router.put('/:id/payment/received',
  validateObjectId(),
  protect,
  authorize(UserRole.Farmer, UserRole.Admin),
  markCODPaymentReceived,
);
router.get('/:id/payment/status', validateObjectId(), protect, getCODPaymentStatus);

router.put('/:id/status',
  validateObjectId(),
  protect,
  authorize(UserRole.Farmer, UserRole.Admin, UserRole.Buyer),
  validateRequest({ body: updateOrderStatusSchema }),
  updateOrderStatus,
);

router.post('/:id/review', validateObjectId(), protect, authorize(UserRole.Buyer), trimStrings, addOrderReview);

router.patch('/:id/cancel',
  validateObjectId(),
  protect,
  authorize(UserRole.Buyer, UserRole.Farmer, UserRole.Admin),
  validateRequest({ body: cancelOrderSchema }),
  cancelOrder,
);

router.post('/:id/deny', validateObjectId(), protect, authorize(UserRole.Farmer), trimStrings, denyOrder);
router.patch('/:id/receive', validateObjectId(), protect, authorize(UserRole.Buyer), markOrderReceived);
router.get('/:id/status', validateObjectId(), protect, getOrderStatus);
router.get('/:id/track', validateObjectId(), protect, trackOrder);

export default router;
