import { emitToUser, emitToOrder, emitToConversation } from './socketManager.js';
import type { Types } from 'mongoose';
import type { IOrder, INotification, IMessage } from '../types/index.js';

interface OrderUpdateData {
  orderId: Types.ObjectId | string;
  orderNumber: string;
  orderStatus: string;
  cropName?: string;
  totalAmount?: number;
  updatedAt: Date;
}

interface OrderLike {
  _id: Types.ObjectId | string;
  orderNumber: string;
  orderStatus: string;
  cropName?: string;
  totalAmount?: number;
  buyerId?: Types.ObjectId | string | { _id?: Types.ObjectId | string } | null;
  farmerId?: Types.ObjectId | string | { _id?: Types.ObjectId | string } | null;
}

export function extractIdString(val: unknown): string | null {
  if (!val) return null;
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    if ('_id' in (val as any) && (val as any)._id) return String((val as any)._id);
    if ('id' in (val as any) && (val as any).id) return String((val as any).id);
    if (typeof (val as any).toString === 'function') {
      const str = (val as any).toString();
      if (str !== '[object Object]') return str;
    }
  }
  return null;
}

export function notifyOrderUpdate(order: OrderLike, event: string): void {
  const data: OrderUpdateData = {
    orderId: order._id,
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,
    cropName: order.cropName,
    totalAmount: order.totalAmount,
    updatedAt: new Date(),
  };

  const orderIdStr = extractIdString(order._id);
  if (orderIdStr) {
    emitToOrder(orderIdStr, event, data);
  }

  const buyerIdStr = extractIdString(order.buyerId);
  if (buyerIdStr) {
    emitToUser(buyerIdStr, 'order:updated', { ...data, role: 'buyer' });
  }

  const farmerIdStr = extractIdString(order.farmerId);
  if (farmerIdStr) {
    emitToUser(farmerIdStr, 'order:updated', { ...data, role: 'farmer' });
  }
}

interface NotificationLike {
  _id: Types.ObjectId | string;
  title: string;
  message: string;
  type: string;
  priority?: string;
  actionUrl?: string | null;
  relatedId?: string | null;
  isRead?: boolean;
  createdAt?: Date;
}

export function notifyNewNotification(userId: string, notification: NotificationLike): void {
  emitToUser(userId, 'notification:new', {
    id: notification._id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    priority: notification.priority,
    actionUrl: notification.actionUrl,
    relatedId: notification.relatedId,
    isRead: notification.isRead ?? false,
    createdAt: notification.createdAt ?? new Date(),
  });
}

export function notifyBulkNotification(
  recipientIds: string[],
  notification: Pick<NotificationLike, 'title' | 'message' | 'type' | 'priority' | 'actionUrl'> & { _id?: Types.ObjectId | string },
): void {
  const data = {
    id: notification._id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    priority: notification.priority,
    actionUrl: notification.actionUrl,
    createdAt: new Date(),
  };
  recipientIds.forEach((userId) => emitToUser(userId, 'notification:new', data));
}

interface MessageLike {
  _id: Types.ObjectId | string;
  conversationId: string;
  senderId: Types.ObjectId | string | { _id: Types.ObjectId | string };
  receiverId: Types.ObjectId | string;
  content: string;
  type?: string;
  cropId?: Types.ObjectId | string | null;
  orderId?: Types.ObjectId | string | null;
  createdAt?: Date;
}

export function notifyNewMessage(message: MessageLike): void {
  const senderId =
    typeof message.senderId === 'object' && message.senderId !== null
      ? (message.senderId as { _id: Types.ObjectId | string })._id
      : message.senderId;

  const data = {
    id: message._id,
    conversationId: message.conversationId,
    senderId,
    content: message.content,
    type: message.type ?? 'text',
    cropId: message.cropId,
    orderId: message.orderId,
    createdAt: message.createdAt ?? new Date(),
  };

  const receiverIdStr = extractIdString(message.receiverId);
  const senderIdStr = extractIdString(senderId);

  if (receiverIdStr) {
    emitToUser(receiverIdStr, 'message:new', data);
    emitToUser(receiverIdStr, 'message:unreadUpdate', { unreadCount: 1 });
  }
  if (senderIdStr) {
    emitToUser(senderIdStr, 'message:sent', data);
  }

  if (message.conversationId) {
    emitToConversation(message.conversationId, 'message:new', data);
  }
}

interface CropLike {
  _id: Types.ObjectId | string;
  cropName: string;
}
interface BuyerLike {
  _id: Types.ObjectId | string;
  firstName?: string;
  name?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
}

export function notifyCropInterest(farmerId: string, crop: CropLike, buyer: BuyerLike): void {
  emitToUser(farmerId, 'crop:interest', {
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
}

export function notifyUserStatusChange(userId: string, status: string, reason?: string): void {
  emitToUser(userId, 'user:statusChanged', { status, reason, timestamp: new Date() });
}

export function notifyKYCUpdate(userId: string, kycStatus: string, rejectionReason?: string): void {
  emitToUser(userId, 'kyc:updated', { kycStatus, rejectionReason, timestamp: new Date() });
}

export function notifyTyping(
  senderId: string,
  receiverId: string,
  conversationId: string,
  isTyping: boolean,
): void {
  const event = isTyping ? 'typing:start' : 'typing:stop';
  emitToUser(receiverId, event, { conversationId, userId: senderId });
}

export function notifyNegotiationUpdate(
  negotiationId: string,
  farmerId: string,
  buyerId: string,
  event: 'negotiation:new' | 'negotiation:updated',
  data: Record<string, unknown>
): void {
  emitToUser(farmerId, event, { negotiationId, ...data });
  emitToUser(buyerId, event, { negotiationId, ...data });
}
