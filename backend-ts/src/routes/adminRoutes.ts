import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import * as couponController from '../controllers/couponController.js';
import { protect, authorize } from '../middleware/auth.js';
import { UserRole } from '../types/enums.js';

import validateRequest, { validateObjectId } from '../middleware/validator.js';
import {
  labelOrderAnomalySchema,
  changeUserRoleSchema,
  rejectUserKycSchema,
  sendAnnouncementSchema,
} from '../schemas/adminSchemas.js';
import { createCouponSchema, updateCouponSchema } from '../schemas/couponSchemas.js';

const router = Router();

router.patch('/kyc/result-seen', protect, adminController.markKYCResultSeen);

router.use(protect, authorize(UserRole.Admin));

router.get('/documents/proxy', adminController.proxyDocument);

router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/users', adminController.getAllUsers);
router.get('/users-with-crops', adminController.getUsersWithCrops);
router.get('/users/approved/farmers', adminController.getApprovedFarmers);
router.get('/users/approved/buyers', adminController.getApprovedBuyers);
router.get('/users/suspended', adminController.getSuspendedUsers);
router.patch('/users/:userId/status', validateObjectId('userId'), adminController.toggleUserStatus);
router.delete('/users/:userId', validateObjectId('userId'), adminController.deleteUser);

router.get('/kyc/pending', adminController.getPendingKYC);
router.get('/kyc/rejected', adminController.getRejectedKYC);
router.get('/debug/users-kyc-status', adminController.debugGetAllUsersKYCStatus);
router.patch('/kyc/:userId/approve', validateObjectId('userId'), adminController.approveUserKYC);
router.patch('/kyc/:userId/reject', validateObjectId('userId'), validateRequest({ body: rejectUserKycSchema }), adminController.rejectUserKYC);

router.get('/documents/search', adminController.searchDocuments);
router.get('/documents/:userId', validateObjectId('userId'), adminController.getUserDocuments);

router.get('/crops', adminController.getAllCrops);
router.patch('/crops/:cropId/approve', validateObjectId('cropId'), adminController.approveCrop);
router.patch('/crops/:cropId/reject', validateObjectId('cropId'), adminController.rejectCrop);
router.patch('/crops/:cropId/freeze', validateObjectId('cropId'), adminController.freezeCrop);
router.delete('/crops/:cropId', validateObjectId('cropId'), adminController.deleteCrop);

router.get('/orders/flagged', adminController.getFlaggedOrders);
router.post('/orders/:orderId/anomaly-label', validateObjectId('orderId'), validateRequest({ body: labelOrderAnomalySchema }), adminController.labelOrderAnomaly);
router.get('/orders', adminController.getAllOrders);
router.patch('/orders/:orderId/status', validateObjectId('orderId'), adminController.updateOrderStatus);

router.get('/coupons', couponController.getAllCoupons);
router.post('/coupons', validateRequest({ body: createCouponSchema }), couponController.createCoupon);
router.patch('/coupons/:id', validateObjectId('id'), validateRequest({ body: updateCouponSchema }), couponController.updateCoupon);
router.delete('/coupons/:id', validateObjectId('id'), couponController.deleteCoupon);

router.post('/announcements', validateRequest({ body: sendAnnouncementSchema }), adminController.sendAnnouncement);
router.get('/logs', adminController.getSystemLogs);
router.get('/analytics/dashboard', adminController.getDashboardAnalytics);
router.get('/analytics/farmers/:farmerId', validateObjectId('farmerId'), adminController.getFarmerAnalytics);
router.get('/analytics/buyers/:buyerId', validateObjectId('buyerId'), adminController.getBuyerAnalytics);
router.get('/audit-logs', adminController.getAuditLogs);
router.patch('/users/:userId/role', validateObjectId('userId'), validateRequest({ body: changeUserRoleSchema }), adminController.changeUserRole);

export default router;
