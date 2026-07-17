import { Router } from 'express';
import * as dataAccessController from '../controllers/dataAccessController.js';
import { protect, authorize } from '../middleware/auth.js';
import { UserRole } from '../types/enums.js';

const router = Router();

router.get('/crops', dataAccessController.getPublicApprovedCrops);
router.get('/crops/search', dataAccessController.searchCrops);
router.get('/farmers/:farmerId', dataAccessController.getPublicFarmerProfile);

router.get('/farmer/crops', protect, authorize(UserRole.Farmer), dataAccessController.getFarmerCrops);
router.get('/farmer/orders', protect, authorize(UserRole.Farmer), dataAccessController.getFarmerOrders);
router.get('/farmer/earnings', protect, authorize(UserRole.Farmer), dataAccessController.getFarmerEarnings);

router.get('/buyer/crops', protect, authorize(UserRole.Buyer), dataAccessController.getBuyerApprovedCrops);
router.get('/buyer/orders', protect, authorize(UserRole.Buyer), dataAccessController.getBuyerOrders);
router.get('/buyer/wishlist', protect, authorize(UserRole.Buyer), dataAccessController.getBuyerWishlist);

router.get('/admin/crops', protect, authorize(UserRole.Admin), dataAccessController.getAdminAllCrops);
router.get('/admin/orders', protect, authorize(UserRole.Admin), dataAccessController.getAdminAllOrders);
router.get('/admin/users/:role', protect, authorize(UserRole.Admin), dataAccessController.getAdminUsersByRole);

export default router;
