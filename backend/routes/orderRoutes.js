import express from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  addOrderReview,
  completeVerificationCall,
  adminApprovalOrder,
  addAdditionalCharges,
  issueFineToOrder,
  markPaymentReceived,
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All order routes require authentication
router.post('/', protect, createOrder);
router.get('/my-orders', protect, getOrders); // Get current user's orders
router.get('/', protect, getOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, updateOrderStatus);
router.post('/:id/review', protect, addOrderReview);

// COD Verification Workflow - Admin only
router.put('/:id/verification-call', protect, authorize('admin'), completeVerificationCall); // Complete verification call
router.put('/:id/admin-approval', protect, authorize('admin'), adminApprovalOrder); // Admin approval
router.put('/:id/additional-charges', protect, authorize('admin'), addAdditionalCharges); // Add charges for buyer issues
router.put('/:id/issue-fine', protect, authorize('admin'), issueFineToOrder); // Issue fine (reduces rating)
router.put('/:id/payment-received', protect, authorize('admin'), markPaymentReceived); // Mark COD payment as received

export default router;
