import express from 'express';
import * as userController from '../controllers/userController.js';
import * as adminController from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes - no auth required
router.get('/community/stats', adminController.getPublicCommunityStats);

// Protected routes - User only
router.get('/profile', protect, userController.getUserProfile);
router.put('/profile', protect, userController.updateUserProfile);
router.post('/address', protect, userController.addAddress);
router.get('/addresses', protect, userController.getAddresses);
router.delete('/address/:addressId', protect, userController.deleteAddress);

// Public routes
router.get('/farmer/:farmerId', userController.getFarmerProfile);

// Admin only routes
router.get('/all/buyers', protect, authorize('admin'), userController.getAllBuyers);
router.get('/all/farmers', protect, authorize('admin'), userController.getAllFarmers);

export default router;
