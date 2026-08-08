import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import * as couponController from '../controllers/couponController.js';
import { protect, authorize } from '../middleware/auth.js';
import { UserRole } from '../types/enums.js';

const router = Router();

router.get('/documents/proxy', adminController.proxyDocument);

router.patch('/kyc/result-seen', protect, adminController.markKYCResultSeen);

router.use(protect, authorize(UserRole.Admin));

router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/users', adminController.getAllUsers);
router.get('/users-with-crops', adminController.getUsersWithCrops);
router.get('/users/approved/farmers', adminController.getApprovedFarmers);
router.get('/users/approved/buyers', adminController.getApprovedBuyers);
router.get('/users/suspended', adminController.getSuspendedUsers);
router.patch('/users/:userId/status', adminController.toggleUserStatus);
router.delete('/users/:userId', adminController.deleteUser);

router.get('/kyc/pending', adminController.getPendingKYC);
router.get('/kyc/rejected', adminController.getRejectedKYC);
router.get('/debug/users-kyc-status', adminController.debugGetAllUsersKYCStatus);
router.patch('/kyc/:userId/approve', adminController.approveUserKYC);
router.patch('/kyc/:userId/reject', adminController.rejectUserKYC);

router.get('/documents/search', adminController.searchDocuments);
router.get('/documents/:userId', adminController.getUserDocuments);

router.get('/crops', adminController.getAllCrops);
router.patch('/crops/:cropId/approve', adminController.approveCrop);
router.patch('/crops/:cropId/reject', adminController.rejectCrop);
router.patch('/crops/:cropId/freeze', adminController.freezeCrop);
router.delete('/crops/:cropId', adminController.deleteCrop);

router.get('/orders', adminController.getAllOrders);
router.patch('/orders/:orderId/status', adminController.updateOrderStatus);

router.get('/coupons', couponController.getAllCoupons);
router.post('/coupons', couponController.createCoupon);
router.patch('/coupons/:id', couponController.updateCoupon);
router.delete('/coupons/:id', couponController.deleteCoupon);

router.post('/announcements', adminController.sendAnnouncement);
router.get('/logs', adminController.getSystemLogs);
router.get('/analytics/dashboard', adminController.getDashboardAnalytics);
router.get('/analytics/farmers/:farmerId', adminController.getFarmerAnalytics);
router.get('/analytics/buyers/:buyerId', adminController.getBuyerAnalytics);
router.get('/audit-logs', adminController.getAuditLogs);
router.patch('/users/:userId/role', adminController.changeUserRole);

export default router;
