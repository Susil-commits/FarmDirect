import { Router } from 'express';
import * as notificationController from '../controllers/notificationController.js';
import { protect, authorize } from '../middleware/auth.js';
import { UserRole } from '../types/enums.js';

import validateRequest, { validateObjectId } from '../middleware/validator.js';
import {
  updatePreferencesSchema,
  createNotificationSchema,
  sendBulkNotificationsSchema,
} from '../schemas/notificationSchemas.js';

const router = Router();

router.get('/unread/count', protect, notificationController.getUnreadCount);
router.get('/', protect, notificationController.getNotifications);
router.put('/:notificationId/read', protect, validateObjectId('notificationId'), notificationController.markAsRead);
router.put('/read/all', protect, notificationController.markAllAsRead);
router.delete('/:notificationId', protect, validateObjectId('notificationId'), notificationController.deleteNotification);
router.delete('/delete/all', protect, notificationController.deleteAllNotifications);
router.get('/preferences', protect, notificationController.getPreferences);
router.put('/preferences', protect, validateRequest({ body: updatePreferencesSchema }), notificationController.updatePreferences);
router.post('/create', protect, authorize(UserRole.Admin), validateRequest({ body: createNotificationSchema }), notificationController.createNotification);
router.post('/bulk', protect, authorize(UserRole.Admin), validateRequest({ body: sendBulkNotificationsSchema }), notificationController.sendBulkNotifications);

export default router;
