import { emitToUser, emitToRole, emitToOrder, emitToConversation, emitToAll } from './socketManager.js';

export const notifyOrderUpdate = (order, event) => {
  const data = {
    orderId: order._id,
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,
    cropName: order.cropName,
    totalAmount: order.totalAmount,
    updatedAt: new Date(),
  };

  emitToOrder(order._id.toString(), event, data);

  emitToUser(order.buyerId.toString(), 'order:updated', {
    ...data,
    role: 'buyer',
  });

  emitToUser(order.farmerId.toString(), 'order:updated', {
    ...data,
    role: 'farmer',
  });
};

export const notifyNewNotification = (userId, notification) => {
  emitToUser(userId.toString(), 'notification:new', {
    id: notification._id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    priority: notification.priority,
    actionUrl: notification.actionUrl,
    relatedId: notification.relatedId,
    isRead: notification.isRead || false,
    createdAt: notification.createdAt || new Date(),
  });
};

export const notifyBulkNotification = (recipientIds, notification) => {
  const data = {
    id: notification._id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    priority: notification.priority,
    actionUrl: notification.actionUrl,
    createdAt: new Date(),
  };

  recipientIds.forEach((userId) => {
    emitToUser(userId.toString(), 'notification:new', data);
  });
};

export const notifyNewMessage = (message) => {
  const data = {
    id: message._id,
    conversationId: message.conversationId,
    senderId: message.senderId?._id || message.senderId,
    content: message.content,
    type: message.type || 'text',
    cropId: message.cropId,
    orderId: message.orderId,
    createdAt: message.createdAt || new Date(),
  };

  emitToUser(message.receiverId.toString(), 'message:new', data);
  emitToUser(message.senderId.toString(), 'message:sent', data);

  if (message.conversationId) {
    emitToConversation(message.conversationId, 'message:new', data);
  }

  emitToUser(message.receiverId.toString(), 'message:unreadUpdate', {
    unreadCount: 1,
  });
};

export const notifyCropInterest = (farmerId, crop, buyer) => {
  emitToUser(farmerId.toString(), 'crop:interest', {
    cropId: crop._id,
    cropName: crop.cropName,
    buyerId: buyer._id,
    buyerName: buyer.firstName || buyer.name,
    buyerPhone: buyer.phone,
    buyerEmail: buyer.email,
    buyerCity: buyer.city,
    buyerState: buyer.state,
    interestedAt: new Date(),
  });
};

export const notifyUserStatusChange = (userId, status, reason) => {
  emitToUser(userId.toString(), 'user:statusChanged', {
    status,
    reason,
    timestamp: new Date(),
  });
};

export const notifyKYCUpdate = (userId, kycStatus, rejectionReason) => {
  emitToUser(userId.toString(), 'kyc:updated', {
    kycStatus,
    rejectionReason,
    timestamp: new Date(),
  });
};

export const notifyTyping = (senderId, receiverId, conversationId, isTyping) => {
  const event = isTyping ? 'typing:start' : 'typing:stop';
  emitToUser(receiverId.toString(), event, {
    conversationId,
    userId: senderId,
  });
};