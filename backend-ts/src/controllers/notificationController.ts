import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendError } from '../utils/apiResponse.js';
import { notifyNewNotification, notifyBulkNotification } from '../socket/eventHandlers.js';
import type { Request, Response } from 'express';
import type { Types } from 'mongoose';
import { parsePagination } from '../utils/pagination.js';

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const { isRead } = req.query as Record<string, string>;
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 20, maxLimit: 50 });
  const query: Record<string, unknown> = { userId };
  if (isRead !== undefined) query.isRead = isRead === 'true';

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query).lean().skip(skip).limit(limit).sort({ createdAt: -1 }),
    Notification.countDocuments(query),
    Notification.countDocuments({ userId, isRead: false }),
  ]);

  res.status(200).json({
    success: true, data: notifications, unreadCount,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { notificationId } = req.params;
  const notification = await Notification.findByIdAndUpdate(notificationId, { isRead: true }, { new: true });
  if (!notification) return sendError(res, 'Notification not found', 404);
  res.status(200).json({ success: true, message: 'Notification marked as read', data: notification });
});

export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  await Notification.updateMany({ userId: req.user!._id, isRead: false }, { isRead: true });
  res.status(200).json({ success: true, message: 'All notifications marked as read' });
});

export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  const notification = await Notification.findOneAndDelete({ _id: req.params.notificationId, userId: req.user!._id });
  if (!notification) return sendError(res, 'Notification not found', 404);
  res.status(200).json({ success: true, message: 'Notification deleted successfully' });
});

export const deleteAllNotifications = asyncHandler(async (req: Request, res: Response) => {
  await Notification.deleteMany({ userId: req.user!._id });
  res.status(200).json({ success: true, message: 'All notifications deleted successfully' });
});

export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const unreadCount = await Notification.countDocuments({ userId: req.user!._id, isRead: false });
  res.status(200).json({ success: true, unreadCount });
});

export const createNotification = asyncHandler(async (req: Request, res: Response) => {
  const { userId, title, message, type, relatedId, actionUrl } = req.body as Record<string, unknown>;
  const notification = await Notification.create({ userId, title, message, type, relatedId, actionUrl, isRead: false });
  notifyNewNotification(String(userId), notification);
  res.status(201).json({ success: true, message: 'Notification created successfully', data: notification });
});

export const sendBulkNotifications = asyncHandler(async (req: Request, res: Response) => {
  const { userIds, title, message, type } = req.body as { userIds: string[]; title: string; message: string; type: string };
  const notifications = userIds.map((userId) => ({ userId, title, message, type, isRead: false, createdAt: new Date() }));
  const result = await Notification.insertMany(notifications);
  notifyBulkNotification(userIds, { title, message, type, _id: result[0]?._id as Types.ObjectId | undefined });
  res.status(201).json({ success: true, message: 'Bulk notifications sent successfully', count: result.length });
});

export const getPreferences = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!._id).select('notificationPreferences');
  const preferences = user?.notificationPreferences || {
    orderUpdates: true, cropUpdates: true, reviews: true, promotions: false, email: true, push: true,
  };
  res.status(200).json({ success: true, data: preferences });
});

export const updatePreferences = asyncHandler(async (req: Request, res: Response) => {
  const preferences = req.body;
  await User.findByIdAndUpdate(req.user!._id, { notificationPreferences: preferences });
  res.status(200).json({ success: true, message: 'Preferences updated successfully', data: preferences });
});
