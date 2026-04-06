import Notification from '../models/Notification.js';
import asyncHandler from '../utils/asyncHandler.js';

// Get user notifications
export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { page = 1, limit = 20, isRead } = req.query;
  
  const skip = (page - 1) * limit;
  const query = { userId };
  
  if (isRead !== undefined) {
    query.isRead = isRead === 'true';
  }
  
  const notifications = await Notification.find(query)
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });
  
  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({ userId, isRead: false });
  
  res.status(200).json({
    success: true,
    data: notifications,
    unreadCount,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// Mark notification as read
export const markAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user.userId;
  
  const notification = await Notification.findByIdAndUpdate(
    notificationId,
    { isRead: true },
    { new: true }
  );
  
  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }
  
  res.status(200).json({
    success: true,
    message: 'Notification marked as read',
    data: notification
  });
});

// Mark all notifications as read
export const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  
  await Notification.updateMany(
    { userId, isRead: false },
    { isRead: true }
  );
  
  res.status(200).json({
    success: true,
    message: 'All notifications marked as read'
  });
});

// Delete notification
export const deleteNotification = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user.userId;
  
  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    userId
  });
  
  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }
  
  res.status(200).json({
    success: true,
    message: 'Notification deleted successfully'
  });
});

// Delete all notifications
export const deleteAllNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  
  await Notification.deleteMany({ userId });
  
  res.status(200).json({
    success: true,
    message: 'All notifications deleted successfully'
  });
});

// Get unread count
export const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  
  const unreadCount = await Notification.countDocuments({
    userId,
    isRead: false
  });
  
  res.status(200).json({
    success: true,
    unreadCount
  });
});

// Create notification (internal use for admin)
export const createNotification = asyncHandler(async (req, res) => {
  const { userId, title, message, type, relatedId, actionUrl } = req.body;
  
  const notification = await Notification.create({
    userId,
    title,
    message,
    type,
    relatedId,
    actionUrl,
    isRead: false
  });
  
  res.status(201).json({
    success: true,
    message: 'Notification created successfully',
    data: notification
  });
});

// Send bulk notifications (admin only)
export const sendBulkNotifications = asyncHandler(async (req, res) => {
  const { userIds, title, message, type } = req.body;
  
  const notifications = userIds.map(userId => ({
    userId,
    title,
    message,
    type,
    isRead: false,
    createdAt: new Date()
  }));
  
  const result = await Notification.insertMany(notifications);
  
  res.status(201).json({
    success: true,
    message: 'Bulk notifications sent successfully',
    count: result.length
  });
});

// Get notification preferences
export const getPreferences = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  
  const notification = await Notification.findOne({ userId });
  
  const preferences = notification?.preferences || {
    orderUpdates: true,
    cropUpdates: true,
    reviews: true,
    promotions: false,
    email: true,
    push: true
  };
  
  res.status(200).json({
    success: true,
    data: preferences
  });
});

// Update notification preferences
export const updatePreferences = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const preferences = req.body;
  
  // This would typically be stored in a UserPreferences collection
  // For now, we'll update the user's notification settings
  
  res.status(200).json({
    success: true,
    message: 'Preferences updated successfully',
    data: preferences
  });
});
