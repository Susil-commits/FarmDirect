import express from 'express';
import * as notificationController from '../controllers/notificationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get unread count
router.get('/unread/count', protect, notificationController.getUnreadCount);

// Get all notifications
router.get('/', protect, notificationController.getNotifications);

// Mark notification as read
router.put('/:notificationId/read', protect, notificationController.markAsRead);

// Mark all as read
router.put('/read/all', protect, notificationController.markAllAsRead);

// Delete notification
router.delete('/:notificationId', protect, notificationController.deleteNotification);

// Delete all notifications
router.delete('/delete/all', protect, notificationController.deleteAllNotifications);

// Get preferences
router.get('/preferences', protect, notificationController.getPreferences);

// Update preferences
router.put('/preferences', protect, notificationController.updatePreferences);

// Admin: Create notification
router.post('/create', protect, authorize('admin'), notificationController.createNotification);

// Admin: Send bulk notifications
router.post('/bulk', protect, authorize('admin'), notificationController.sendBulkNotifications);

export default router;
