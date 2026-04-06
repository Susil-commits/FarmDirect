import express from 'express';
import * as adminController from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require admin authorization
router.use(protect, authorize('admin'));

// Dashboard
router.get('/dashboard/stats', adminController.getDashboardStats);

// Users management
router.get('/users', adminController.getAllUsers);
router.get('/users-with-crops', adminController.getUsersWithCrops);
router.patch('/users/:userId/status', adminController.toggleUserStatus);
router.delete('/users/:userId', adminController.deleteUser);

// KYC Management
router.get('/kyc/pending', adminController.getPendingKYC);
router.patch('/kyc/:farmerId/approve', adminController.approveFarmerKYC);
router.patch('/kyc/:farmerId/reject', adminController.rejectFarmerKYC);

// Crops management
router.get('/crops', adminController.getAllCrops);
router.patch('/crops/:cropId/approve', adminController.approveCrop);
router.patch('/crops/:cropId/reject', adminController.rejectCrop);

// Orders management
router.get('/orders', adminController.getAllOrders);
router.patch('/orders/:orderId/status', adminController.updateOrderStatus);

// Announcements
router.post('/announcements', adminController.sendAnnouncement);

// System logs
router.get('/logs', adminController.getSystemLogs);

export default router;
