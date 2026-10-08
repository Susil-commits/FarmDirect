import { randomUUID } from 'node:crypto';
import mongoose, { type ClientSession, type Types } from 'mongoose';
import Order from '../models/Order.js';
import CropListing from '../models/CropListing.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { createOutboxEvent, triggerImmediateOutboxSweep } from '../workers/outboxPublisher.js';
import { enqueueAnomalyDetection } from '../workers/queue.js';
import { notifyOrderUpdate } from '../socket/eventHandlers.js';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  CropAvailability,
  ListingApprovalStatus,
} from '../types/enums.js';
import {
  InsufficientStockError,
  CropNotFoundError,
  CropUnavailableError,
  ListingPendingApprovalError,
} from '../utils/apiError.js';
import type { IOrder } from '../types/index.js';

export function generateOrderNumber(): string {
  return 'ORD-' + randomUUID().replace(/-/g, '').substring(0, 12).toUpperCase();
}

export interface CreateOrderParams {
  buyerId: Types.ObjectId | string;
  cropId: Types.ObjectId | string;
  quantity: number;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  orderStatus?: OrderStatus;
  couponCode?: string | null;
  discountAmount?: number;
  customUnitPrice?: number;
  buyerContact?: string;
  notes?: string;
  timelineEvent?: {
    event: string;
    description: string;
  };
}

export interface CreatedOrderResult {
  order: IOrder;
  cropName: string;
  farmerId: Types.ObjectId | string;
  totalAmount: number;
}

/**
 * Atomically validates stock, decrements inventory, and creates an Order document within an active MongoDB session.
 * Throws typed ApiError subclasses (CropNotFoundError, InsufficientStockError, etc.) on failures.
 */
export async function createOrderInSession(
  params: CreateOrderParams,
  session: ClientSession,
): Promise<CreatedOrderResult> {
  const {
    buyerId,
    cropId,
    quantity,
    paymentMethod = PaymentMethod.Cod,
    paymentStatus = PaymentStatus.Pending,
    orderStatus = OrderStatus.Confirmed,
    couponCode = null,
    discountAmount = 0,
    customUnitPrice,
    buyerContact = '',
    notes,
    timelineEvent,
  } = params;

  if (quantity <= 0) {
    throw new InsufficientStockError('Order quantity must be at least 1 unit');
  }

  if (!cropId || !mongoose.isValidObjectId(cropId)) {
    throw new CropNotFoundError(`Invalid crop ID provided`);
  }
  const safeCropId = new mongoose.Types.ObjectId(String(cropId));

  if (!buyerId || !mongoose.isValidObjectId(buyerId)) {
    throw new CropNotFoundError('Invalid buyer ID provided');
  }
  const safeBuyerId = new mongoose.Types.ObjectId(String(buyerId));

  const crop = await CropListing.findById(safeCropId).session(session);
  if (!crop) {
    throw new CropNotFoundError(`Crop with ID "${cropId}" not found`);
  }

  if (crop.listingApprovalStatus !== ListingApprovalStatus.Approved) {
    throw new ListingPendingApprovalError(`Crop "${crop.cropName}" is pending admin approval`);
  }

  if (crop.availability !== CropAvailability.Available) {
    throw new CropUnavailableError(`Crop "${crop.cropName}" is no longer available`);
  }

  if (crop.quantity < quantity) {
    throw new InsufficientStockError(
      `Insufficient quantity for ${crop.cropName}. Available: ${crop.quantity} ${crop.unit}`,
    );
  }

  const unitPrice = customUnitPrice !== undefined ? customUnitPrice : crop.price;
  const originalAmount = unitPrice * quantity;
  const finalTotalAmount = Math.max(0, Math.round((originalAmount - discountAmount) * 100) / 100);

  const initialTimeline = timelineEvent
    ? [{ event: timelineEvent.event, description: timelineEvent.description, timestamp: new Date() }]
    : [{ event: 'ORDER_CONFIRMED', description: 'Order confirmed. Farmer will prepare your order.', timestamp: new Date() }];

  const orderNumber = generateOrderNumber();

  const [order] = await Order.create(
    [
      {
        orderNumber,
        buyerId: safeBuyerId,
        farmerId: crop.farmerId,
        cropId: crop._id,
        cropName: crop.cropName,
        quantity,
        unitPrice,
        originalAmount,
        discountAmount,
        couponCode,
        totalAmount: finalTotalAmount,
        pickupLocation: crop.pickupLocation,
        farmerContact: crop.contactNumber,
        buyerContact,
        paymentMethod,
        paymentStatus,
        orderStatus,
        notes,
        timeline: initialTimeline,
      },
    ],
    { session },
  );

  // Atomically decrement stock and link interested buyer if present
  const updatedCrop = await CropListing.findOneAndUpdate(
    { _id: crop._id, quantity: { $gte: quantity } },
    {
      $inc: { quantity: -quantity, sold: quantity },
      $set: {
        'interestedBuyers.$[elem].status': 'ordered',
        'interestedBuyers.$[elem].orderId': order._id,
      },
    },
    {
      arrayFilters: [{ 'elem.buyerId': buyerId }],
      new: true,
      session,
    },
  );

  if (!updatedCrop) {
    throw new InsufficientStockError(
      `Insufficient stock — "${crop.cropName}" sold out before your order could be confirmed`,
    );
  }

  if (updatedCrop.quantity <= 0) {
    await CropListing.findByIdAndUpdate(
      crop._id,
      { availability: CropAvailability.NotAvailable },
      { session },
    );
  }

  return {
    order,
    cropName: crop.cropName,
    farmerId: crop.farmerId,
    totalAmount: finalTotalAmount,
  };
}

/**
 * Handles async side effects after a successful order commit (socket, outbox sweep, anomaly queue, notification).
 */
export async function handlePostOrderCreation(
  order: IOrder,
  buyerName = 'Buyer',
): Promise<void> {
  try {
    enqueueAnomalyDetection({
      orderId: String(order._id),
      amount: order.totalAmount,
      userId: String(order.buyerId),
    });
    notifyOrderUpdate(order, 'order:created');
    triggerImmediateOutboxSweep();
  } catch (err) {
    console.error('[OrderService] Error triggering post-order creation tasks:', err);
  }
}
