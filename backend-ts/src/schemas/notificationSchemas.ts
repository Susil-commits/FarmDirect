import { z } from 'zod';

export const updatePreferencesSchema = z.object({
  orderUpdates: z.boolean().optional(),
  cropUpdates: z.boolean().optional(),
  reviews: z.boolean().optional(),
  promotions: z.boolean().optional(),
  email: z.boolean().optional(),
  push: z.boolean().optional(),
});

export const createNotificationSchema = z.object({
  userId: z.string().min(1, 'Target user ID is required'),
  title: z.string().min(1, 'Notification title is required'),
  message: z.string().min(1, 'Notification message is required'),
  type: z.string().default('general'),
  relatedId: z.string().optional(),
  actionUrl: z.string().optional(),
});

export const sendBulkNotificationsSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1, 'At least one recipient user ID is required'),
  title: z.string().min(1, 'Notification title is required'),
  message: z.string().min(1, 'Notification message is required'),
  type: z.string().default('general'),
});
