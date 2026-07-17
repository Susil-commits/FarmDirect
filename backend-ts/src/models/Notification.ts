import mongoose, { Schema, type Model } from 'mongoose';
import type { INotification } from '../types/index.js';
import { NotificationType, NotificationPriority } from '../types/enums.js';

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: Object.values(NotificationType), default: NotificationType.General },
    relatedId: { type: String, default: null },
    data: { type: Schema.Types.Mixed, default: {} },
    actionUrl: { type: String, default: null },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    priority: {
      type: String,
      enum: Object.values(NotificationPriority),
      default: NotificationPriority.Medium,
    },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });

const Notification: Model<INotification> = mongoose.model<INotification>(
  'Notification',
  notificationSchema,
);
export default Notification;
