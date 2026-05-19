import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['order', 'interest', 'review', 'payment', 'promotion', 'general'],
      default: 'general'
    },
    relatedId: {
      type: String, // Order ID, Crop ID, etc.
      default: null
    },
    // Additional data payload
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    actionUrl: {
      type: String,
      default: null
    },
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date,
      default: null
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  },
  { timestamps: true }
);

// Index for finding unread notifications
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });

export default mongoose.model('Notification', notificationSchema);
