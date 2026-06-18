import express from 'express';
import * as dataAccessController from '../controllers/dataAccessController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * PHASE 2: DATA ACCESS CONTROL ROUTES
 * Role-specific endpoints for marketplace access
 */

// ============ PUBLIC/GUEST ROUTES (No Auth Required) ============
router.get('/crops', dataAccessController.getPublicApprovedCrops);
router.get('/crops/search', dataAccessController.searchCrops);
router.get('/farmers/:farmerId', dataAccessController.getPublicFarmerProfile);

// ============ FARMER ROUTES (Auth + Farmer Role) ============
router.get('/farmer/crops', protect, authorize('farmer'), dataAccessController.getFarmerCrops);
router.get('/farmer/orders', protect, authorize('farmer'), dataAccessController.getFarmerOrders);
router.get('/farmer/earnings', protect, authorize('farmer'), dataAccessController.getFarmerEarnings);

// ============ BUYER ROUTES (Auth + Buyer Role) ============
router.get('/buyer/crops', protect, authorize('buyer'), dataAccessController.getBuyerApprovedCrops);
router.get('/buyer/orders', protect, authorize('buyer'), dataAccessController.getBuyerOrders);
router.get('/buyer/wishlist', protect, authorize('buyer'), dataAccessController.getBuyerWishlist);

// ============ ADMIN ROUTES (Auth + Admin Role) ============
router.get('/admin/crops', protect, authorize('admin'), dataAccessController.getAdminAllCrops);
router.get('/admin/orders', protect, authorize('admin'), dataAccessController.getAdminAllOrders);
router.get('/admin/users/:role', protect, authorize('admin'), dataAccessController.getAdminUsersByRole);

export default router;
