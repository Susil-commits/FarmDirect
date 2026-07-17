import { Router } from 'express';
import * as notificationController from '../controllers/notificationController.js';
import { protect, authorize } from '../middleware/auth.js';
import { UserRole } from '../types/enums.js';

const router = Router();

router.get('/unread/count', protect, notificationController.getUnreadCount);
router.get('/', protect, notificationController.getNotifications);
router.put('/:notificationId/read', protect, notificationController.markAsRead);
router.put('/read/all', protect, notificationController.markAllAsRead);
router.delete('/:notificationId', protect, notificationController.deleteNotification);
router.delete('/delete/all', protect, notificationController.deleteAllNotifications);
router.get('/preferences', protect, notificationController.getPreferences);
router.put('/preferences', protect, notificationController.updatePreferences);
router.post('/create', protect, authorize(UserRole.Admin), notificationController.createNotification);
router.post('/bulk', protect, authorize(UserRole.Admin), notificationController.sendBulkNotifications);

export default router;
