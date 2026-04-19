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
router.use(protect, authorize('farmer'));
router.get('/farmer/crops', dataAccessController.getFarmerCrops);
router.get('/farmer/orders', dataAccessController.getFarmerOrders);
router.get('/farmer/earnings', dataAccessController.getFarmerEarnings);

// ============ BUYER ROUTES (Auth + Buyer Role) ============
router.use(protect, authorize('buyer'));
router.get('/buyer/crops', dataAccessController.getBuyerApprovedCrops);
router.get('/buyer/orders', dataAccessController.getBuyerOrders);
router.get('/buyer/wishlist', dataAccessController.getBuyerWishlist);

// ============ ADMIN ROUTES (Auth + Admin Role) ============
router.use(protect, authorize('admin'));
router.get('/admin/crops', dataAccessController.getAdminAllCrops);
router.get('/admin/orders', dataAccessController.getAdminAllOrders);
router.get('/admin/users/:role', dataAccessController.getAdminUsersByRole);

export default router;
