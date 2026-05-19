import Message from '../models/Message.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Send a message
 * POST /api/messages
 */
export const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, content, cropId, orderId, type = 'text', attachments = [] } = req.body;
  const senderId = req.user._id;

  // Validation
  if (!receiverId) {
    return res.status(400).json({ message: 'Receiver ID is required' });
  }

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ message: 'Message content cannot be empty' });
  }

  // Prevent sending to self
  if (senderId.toString() === receiverId.toString()) {
    return res.status(400).json({ message: 'Cannot send message to yourself' });
  }

  // Verify receiver exists
  const receiver = await User.findById(receiverId);
  if (!receiver) {
    return res.status(404).json({ message: 'Receiver not found' });
  }

  // Generate conversation ID
  const conversationId = Message.generateConversationId(senderId, receiverId);

  // Create message
  const message = await Message.create({
    senderId,
    receiverId,
    content: content.trim(),
    cropId: cropId || null,
    orderId: orderId || null,
    type,
    attachments,
    conversationId,
    metadata: {
      deviceType: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop',
    },
  });

  const populatedMessage = await message.populate([
    { path: 'senderId', select: 'firstName lastName email profilePhoto role' },
    { path: 'receiverId', select: 'firstName lastName email profilePhoto role' },
  ]);

  res.status(201).json({
    success: true,
    message: 'Message sent successfully',
    data: populatedMessage,
  });
});

/**
 * Get conversation between two users
 * GET /api/messages/conversation/:receiverId
 */
export const getConversation = asyncHandler(async (req, res) => {
  const { receiverId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const userId = req.user._id;

  // Verify receiver exists
  const receiver = await User.findById(receiverId);
  if (!receiver) {
    return res.status(404).json({ message: 'User not found' });
  }

  const conversationId = Message.generateConversationId(userId, receiverId);
  const skip = (page - 1) * limit;

  // Fetch messages in descending order (newest first)
  const messages = await Message.find({
    conversationId,
    isDeleted: false,
  })
    .lean()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate([
      { path: 'senderId', select: 'firstName lastName email profilePhoto role' },
      { path: 'receiverId', select: 'firstName lastName email profilePhoto role' },
    ]);

  const totalCount = await Message.countDocuments({
    conversationId,
    isDeleted: false,
  });

  // Reverse to show chronological order (oldest to newest)
  const reversedMessages = messages.reverse();

  // Mark all unread messages from receiver as read
  await Message.updateMany(
    {
      conversationId,
      receiverId: userId,
      isRead: false,
    },
    {
      isRead: true,
      readAt: new Date(),
    }
  );

  res.status(200).json({
    success: true,
    data: reversedMessages,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
    },
  });
});

/**
 * Get all conversations for current user
 * GET /api/messages/conversations
 */
export const getConversations = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  // Get unique conversation IDs involving this user
  const userMessages = await Message.find({
    $or: [{ senderId: userId }, { receiverId: userId }],
    isDeleted: false,
  })
    .lean()
    .select('conversationId senderId receiverId')
    .sort({ createdAt: -1 });

  // Extract unique users from conversations
  const conversationUsers = new Map();
  userMessages.forEach((msg) => {
    const otherUserId =
      msg.senderId.toString() === userId.toString() ? msg.receiverId : msg.senderId;
    if (!conversationUsers.has(otherUserId.toString())) {
      conversationUsers.set(otherUserId.toString(), otherUserId);
    }
  });

  // Get last message for each conversation and sort by recency
  const conversations = [];
  for (const [, otherUserId] of Array.from(conversationUsers).slice(skip, skip + limit)) {
    const conversationId = Message.generateConversationId(userId, otherUserId);

    const lastMessage = await Message.findOne({
      conversationId,
      isDeleted: false,
    })
      .lean()
      .sort({ createdAt: -1 })
      .populate([
        { path: 'senderId', select: 'firstName lastName email profilePhoto role' },
        { path: 'receiverId', select: 'firstName lastName email profilePhoto role' },
      ]);

    const unreadCount = await Message.countDocuments({
      conversationId,
      receiverId: userId,
      isRead: false,
      isDeleted: false,
    });

    const otherUser = await User.findById(otherUserId).select(
      'firstName lastName email profilePhoto role'
    );

    conversations.push({
      otherUser,
      lastMessage,
      unreadCount,
      conversationId,
    });
  }

  // Sort by last message timestamp
  conversations.sort(
    (a, b) =>
      new Date(b.lastMessage?.createdAt || 0) - new Date(a.lastMessage?.createdAt || 0)
  );

  res.status(200).json({
    success: true,
    data: conversations,
    pagination: {
      currentPage: parseInt(page),
      totalCount: conversationUsers.size,
      totalPages: Math.ceil(conversationUsers.size / limit),
    },
  });
});

/**
 * Mark message as read
 * PATCH /api/messages/:messageId/read
 */
export const markMessageAsRead = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;

  const message = await Message.findById(messageId);
  if (!message) {
    return res.status(404).json({ message: 'Message not found' });
  }

  // Only receiver can mark as read
  if (message.receiverId.toString() !== userId.toString()) {
    return res.status(403).json({ message: 'Only receiver can mark message as read' });
  }

  message.isRead = true;
  message.readAt = new Date();
  await message.save();

  res.status(200).json({
    success: true,
    message: 'Message marked as read',
    data: message,
  });
});

/**
 * Mark all messages in conversation as read
 * PATCH /api/messages/conversation/:receiverId/read-all
 */
export const markConversationAsRead = asyncHandler(async (req, res) => {
  const { receiverId } = req.params;
  const userId = req.user._id;

  const conversationId = Message.generateConversationId(userId, receiverId);

  await Message.updateMany(
    {
      conversationId,
      receiverId: userId,
      isRead: false,
    },
    {
      isRead: true,
      readAt: new Date(),
    }
  );

  res.status(200).json({
    success: true,
    message: 'All messages marked as read',
  });
});

/**
 * Delete message (soft delete)
 * DELETE /api/messages/:messageId
 */
export const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;

  const message = await Message.findById(messageId);
  if (!message) {
    return res.status(404).json({ message: 'Message not found' });
  }

  // Only sender can delete their own message
  if (message.senderId.toString() !== userId.toString()) {
    return res.status(403).json({ message: 'Only sender can delete this message' });
  }

  message.isDeleted = true;
  await message.save();

  res.status(200).json({
    success: true,
    message: 'Message deleted successfully',
  });
});

/**
 * Get unread message count
 * GET /api/messages/unread/count
 */
export const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const unreadCount = await Message.countDocuments({
    receiverId: userId,
    isRead: false,
    isDeleted: false,
  });

  // Also get by conversation
  const userMessages = await Message.find({
    receiverId: userId,
    isRead: false,
    isDeleted: false,
  }).lean().select('conversationId');

  const conversationUnread = {};
  userMessages.forEach((msg) => {
    conversationUnread[msg.conversationId] =
      (conversationUnread[msg.conversationId] || 0) + 1;
  });

  res.status(200).json({
    success: true,
    totalUnread: unreadCount,
    byConversation: conversationUnread,
  });
});

/**
 * Search messages
 * GET /api/messages/search?q=query&receiverId=userId
 */
export const searchMessages = asyncHandler(async (req, res) => {
  const { q, receiverId } = req.query;
  const userId = req.user._id;

  if (!q || q.trim().length === 0) {
    return res.status(400).json({ message: 'Search query is required' });
  }

  const conversationId = Message.generateConversationId(userId, receiverId);

  const results = await Message.find({
    conversationId,
    content: { $regex: q, $options: 'i' },
    isDeleted: false,
  })
    .lean()
    .sort({ createdAt: -1 })
    .limit(50)
    .populate([
      { path: 'senderId', select: 'firstName lastName email profilePhoto' },
      { path: 'receiverId', select: 'firstName lastName email profilePhoto' },
    ]);

  res.status(200).json({
    success: true,
    data: results,
  });
});

/**
 * Block/Unblock user
 * POST /api/messages/:userId/block
 */
export const toggleBlockUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user._id;

  if (userId === currentUserId.toString()) {
    return res.status(400).json({ message: 'Cannot block yourself' });
  }

  const currentUser = await User.findById(currentUserId);
  if (!currentUser.blockedUsers) {
    currentUser.blockedUsers = [];
  }

  const isBlocked = currentUser.blockedUsers.includes(userId);

  if (isBlocked) {
    currentUser.blockedUsers = currentUser.blockedUsers.filter(
      (id) => id.toString() !== userId
    );
  } else {
    currentUser.blockedUsers.push(userId);
  }

  await currentUser.save();

  res.status(200).json({
    success: true,
    message: isBlocked ? 'User unblocked' : 'User blocked',
    blocked: !isBlocked,
  });
});
