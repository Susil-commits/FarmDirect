import Message, { type MessageModel } from '../models/Message.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendError } from '../utils/apiResponse.js';
import { notifyNewMessage } from '../socket/eventHandlers.js';
import type { Request, Response } from 'express';

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const { receiverId, content, cropId, orderId, type = 'text', attachments = [] } = req.body as {
    receiverId: string; content: string; cropId?: string; orderId?: string;
    type?: string; attachments?: unknown[];
  };
  const senderId = req.user!._id;

  if (!receiverId) return sendError(res, 'Receiver ID is required', 400);
  if (!content || content.trim().length === 0) return sendError(res, 'Message content cannot be empty', 400);
  if (senderId.toString() === receiverId.toString()) return sendError(res, 'Cannot send message to yourself', 400);

  const receiver = await User.findById(receiverId);
  if (!receiver) return sendError(res, 'Receiver not found', 404);

  const conversationId = (Message as unknown as MessageModel).generateConversationId(senderId.toString(), receiverId);

  // B23 FIX: Use Message.create() directly — Message is already a Mongoose Model.
  // The previous pattern `(Message as unknown as MessageModel).create(...)` was an
  // unsafe double-cast that would silently pass even if the MessageModel type diverged.
  const message = await Message.create({
    senderId, receiverId, content: content.trim(),
    cropId: cropId || null, orderId: orderId || null, type, attachments, conversationId,
    metadata: { deviceType: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop' },
  });

  const populatedMessage = await message.populate([
    { path: 'senderId', select: 'firstName lastName email profilePhoto role' },
    { path: 'receiverId', select: 'firstName lastName email profilePhoto role' },
  ]);

  notifyNewMessage(populatedMessage as never);
  res.status(201).json({ success: true, message: 'Message sent successfully', data: populatedMessage });
});

export const getConversation = asyncHandler(async (req: Request, res: Response) => {
  const { receiverId } = req.params;
  const { page = '1', limit = '50' } = req.query as Record<string, string>;
  const userId = req.user!._id;

  const receiver = await User.findById(receiverId);
  if (!receiver) return sendError(res, 'User not found', 404);

  const conversationId = (Message as unknown as MessageModel).generateConversationId(userId.toString(), receiverId);
  const skip = (Number(page) - 1) * Number(limit);

  const [messages, totalCount] = await Promise.all([
    Message.find({ conversationId, isDeleted: false }).lean().sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Message.countDocuments({ conversationId, isDeleted: false }),
  ]);

  await Message.updateMany({ conversationId, receiverId: userId, isRead: false }, { isRead: true, readAt: new Date() });

  res.status(200).json({
    success: true, data: messages.reverse(),
    pagination: { currentPage: Number(page), totalPages: Math.ceil(totalCount / Number(limit)), totalCount },
  });
});

export const getConversations = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const { page = '1', limit = '20' } = req.query as Record<string, string>;
  const skip = (Number(page) - 1) * Number(limit);

  // Single aggregation: groups by conversationId, gets last message + unread count + other user info
  const { Types } = await import('mongoose');
  const pipeline = [
    { $match: { $or: [{ senderId: new Types.ObjectId(String(userId)) }, { receiverId: new Types.ObjectId(String(userId)) }], isDeleted: false } },
    { $sort: { createdAt: -1 as const } },
    {
      $group: {
        _id: '$conversationId',
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [{ $and: [{ $eq: ['$receiverId', new Types.ObjectId(String(userId))] }, { $eq: ['$isRead', false] }] }, 1, 0],
          },
        },
        otherUserId: {
          $first: {
            $cond: [{ $eq: ['$senderId', new Types.ObjectId(String(userId))] }, '$receiverId', '$senderId'],
          },
        },
      },
    },
    { $sort: { 'lastMessage.createdAt': -1 as const } },
    { $skip: skip },
    { $limit: Number(limit) },
    {
      $lookup: {
        from: 'users',
        localField: 'otherUserId',
        foreignField: '_id',
        as: 'otherUser',
        pipeline: [{ $project: { firstName: 1, lastName: 1, email: 1, profilePicture: 1, role: 1 } }],
      },
    },
    { $addFields: { otherUser: { $arrayElemAt: ['$otherUser', 0] }, conversationId: '$_id' } },
    { $project: { _id: 0 } },
  ];

  const conversations = await (Message as any).aggregate(pipeline);

  // Count total distinct conversations for pagination
  const totalCountResult = await (Message as any).aggregate([
    { $match: { $or: [{ senderId: new Types.ObjectId(String(userId)) }, { receiverId: new Types.ObjectId(String(userId)) }], isDeleted: false } },
    { $group: { _id: '$conversationId' } },
    { $count: 'total' },
  ]);
  const totalCount = totalCountResult[0]?.total || 0;

  res.status(200).json({
    success: true, data: conversations,
    pagination: { currentPage: Number(page), totalCount, totalPages: Math.ceil(totalCount / Number(limit)) },
  });
});

export const markMessageAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { messageId } = req.params;
  const userId = req.user!._id;
  const message = await Message.findById(messageId);
  if (!message) return sendError(res, 'Message not found', 404);
  if (message.receiverId.toString() !== userId.toString()) return sendError(res, 'Only receiver can mark message as read', 403);
  message.isRead = true;
  message.readAt = new Date();
  await message.save();
  res.status(200).json({ success: true, message: 'Message marked as read', data: message });
});

export const markConversationAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { receiverId } = req.params;
  const userId = req.user!._id;
  const conversationId = (Message as unknown as MessageModel).generateConversationId(userId.toString(), receiverId);
  await Message.updateMany({ conversationId, receiverId: userId, isRead: false }, { isRead: true, readAt: new Date() });
  res.status(200).json({ success: true, message: 'All messages marked as read' });
});

export const deleteMessage = asyncHandler(async (req: Request, res: Response) => {
  const { messageId } = req.params;
  const userId = req.user!._id;
  const message = await Message.findById(messageId);
  if (!message) return sendError(res, 'Message not found', 404);
  if (message.senderId.toString() !== userId.toString()) return sendError(res, 'Only sender can delete this message', 403);
  message.isDeleted = true;
  await message.save();
  res.status(200).json({ success: true, message: 'Message deleted successfully' });
});

export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const unreadCount = await Message.countDocuments({ receiverId: userId, isRead: false, isDeleted: false });
  const userMessages = await Message.find({ receiverId: userId, isRead: false, isDeleted: false }).lean().select('conversationId');
  const conversationUnread: Record<string, number> = {};
  userMessages.forEach((msg) => { conversationUnread[msg.conversationId] = (conversationUnread[msg.conversationId] || 0) + 1; });
  res.status(200).json({ success: true, totalUnread: unreadCount, byConversation: conversationUnread });
});

export const searchMessages = asyncHandler(async (req: Request, res: Response) => {
  const { q, receiverId } = req.query as { q?: string; receiverId?: string };
  const userId = req.user!._id;
  if (!q || q.trim().length === 0) return sendError(res, 'Search query is required', 400);
  // B8 FIX: receiverId is required — without it String(undefined) creates a broken conversationId
  if (!receiverId) return sendError(res, 'receiverId is required', 400);
  const conversationId = (Message as unknown as MessageModel).generateConversationId(userId.toString(), receiverId);
  const results = await Message.find({ conversationId, content: { $regex: q, $options: 'i' }, isDeleted: false })
    .lean().sort({ createdAt: -1 }).limit(50);
  res.status(200).json({ success: true, data: results });
});

export const toggleBlockUser = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const currentUserId = req.user!._id;
  if (userId === currentUserId.toString()) return sendError(res, 'Cannot block yourself', 400);

  const currentUser = await User.findById(currentUserId);
  if (!currentUser) return sendError(res, 'User not found', 404);
  if (!currentUser.blockedUsers) currentUser.blockedUsers = [];

  const isBlocked = currentUser.blockedUsers.some((id) => id.toString() === userId);
  if (isBlocked) {
    currentUser.blockedUsers = currentUser.blockedUsers.filter((id) => id.toString() !== userId);
  } else {
    currentUser.blockedUsers.push(userId as never);
  }
  await currentUser.save();
  res.status(200).json({ success: true, message: isBlocked ? 'User unblocked' : 'User blocked', blocked: !isBlocked });
});
