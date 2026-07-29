import { randomUUID } from 'crypto';
import Order from '../models/Order.js';
import CropListing from '../models/CropListing.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import Coupon from '../models/Coupon.js';
import { notifyOrderUpdate } from '../socket/eventHandlers.js';
import { computeDiscount, redeemCoupon } from './couponController.js';
import { sendError } from '../utils/apiResponse.js';
import {
  OrderStatus, PaymentMethod, PaymentStatus, CropAvailability, CropStatus, CancelledBy, UserRole,
} from '../types/enums.js';
import type { OrderTransitionMap, OrderLike } from '../types/index.js';
import type { Request, Response, NextFunction } from 'express';

const VALID_STATUSES: OrderStatus[] = [
  OrderStatus.Confirmed, OrderStatus.Preparing, OrderStatus.ReadyForPickup,
  OrderStatus.PickedUp, OrderStatus.Completed, OrderStatus.Cancelled,
];

const VALID_TRANSITIONS: OrderTransitionMap = {
  [OrderStatus.Confirmed]: [OrderStatus.Preparing, OrderStatus.Cancelled],
  [OrderStatus.Preparing]: [OrderStatus.ReadyForPickup, OrderStatus.Cancelled],
  [OrderStatus.ReadyForPickup]: [OrderStatus.PickedUp, OrderStatus.Cancelled],
  [OrderStatus.PickedUp]: [OrderStatus.Completed],
  [OrderStatus.Completed]: [],
  [OrderStatus.Cancelled]: [],
};

// Statuses a buyer is allowed to advance the order to (NOT cancel — use cancelOrder endpoint)
const BUYER_ALLOWED_TARGET_STATUSES: OrderStatus[] = [OrderStatus.PickedUp];

const STATUS_DESCRIPTIONS: Record<string, string> = {
  preparing: 'Farmer has started preparing your order',
  ready_for_pickup: 'Order is ready for pickup',
  picked_up: 'Order has been picked up',
  completed: 'Order completed successfully',
  cancelled: 'Order has been cancelled',
};

async function recordCropCompletion(order: OrderLike): Promise<void> {
  const crop = await CropListing.findById(order.cropId);
  if (!crop) return;

  const updateFields: Record<string, unknown> = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (crop.quantity <= 0) {
    updateFields.status = CropStatus.SoldOut;
    updateFields.availability = CropAvailability.NotAvailable;
  }

  const todaySalesEntry = (crop.dailySales || []).find(
    (ds) => new Date(ds.date).toDateString() === today.toDateString(),
  );

  if (todaySalesEntry) {
    await CropListing.findByIdAndUpdate(order.cropId, {
      ...updateFields,
      $inc: {
        'dailySales.$[elem].quantity': order.quantity,
        'dailySales.$[elem].revenue': order.totalAmount,
        'monthlyStats.totalRevenue': order.totalAmount,
        'monthlyStats.totalUnits': order.quantity,
      },
    }, {
      arrayFilters: [{ 'elem.date': { $gte: today, $lt: new Date(today.getTime() + 86400000) } }],
    });
  } else {
    await CropListing.findByIdAndUpdate(order.cropId, {
      ...updateFields,
      $push: { dailySales: { date: today, quantity: order.quantity, revenue: order.totalAmount } },
      $inc: {
        'monthlyStats.totalRevenue': order.totalAmount,
        'monthlyStats.totalUnits': order.quantity,
      },
    });
  }
}

export async function startOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cropId, buyerId } = req.body as { cropId?: string; buyerId?: string };
    if (!cropId || !buyerId) {
      sendError(res, 'Crop ID and Buyer ID are required', 400);
      return;
    }

    const crop = await CropListing.findById(cropId);
    if (!crop) {
      sendError(res, 'Crop not found', 404);
      return;
    }
    if (crop.farmerId.toString() !== req.user!._id.toString()) {
      sendError(res, 'Only the crop owner can start an order', 403);
      return;
    }
    if (crop.availability !== CropAvailability.Available) {
      sendError(res, 'This crop is no longer available', 400);
      return;
    }
    if (!crop.quantity || crop.quantity <= 0) {
      sendError(res, 'Insufficient quantity available for this crop', 400);
      return;
    }

    const interestEntry = crop.interestedBuyers.find(
      (ib) => ib.buyerId.toString() === buyerId && ib.status === 'interested',
    );
    if (!interestEntry) {
      sendError(res, 'This buyer has not marked interest in this crop', 400);
      return;
    }

    const existingOrder = await Order.findOne({ cropId, buyerId, orderStatus: { $nin: ['cancelled', 'completed'] } });
    if (existingOrder) {
      sendError(res, 'An active order already exists for this buyer and crop', 400);
      return;
    }

    const buyer = await User.findById(buyerId).select('firstName lastName name phone email city state');
    if (!buyer) {
      sendError(res, 'Buyer not found', 404);
      return;
    }

    const orderQty = 1;
    const totalAmount = crop.price * orderQty;

    const order = await Order.create({
      orderNumber: 'ORD-' + randomUUID().replace(/-/g, '').substring(0, 12).toUpperCase(),
      buyerId,
      farmerId: req.user!._id,
      cropId: crop._id,
      cropName: crop.cropName,
      quantity: orderQty,
      unitPrice: crop.price,
      totalAmount,
      pickupLocation: crop.pickupLocation,
      farmerContact: crop.contactNumber,
      buyerContact: buyer.phone || '',
      paymentMethod: PaymentMethod.Cod,
      paymentStatus: PaymentStatus.Pending,
      orderStatus: OrderStatus.Confirmed,
      timeline: [{ event: 'ORDER_STARTED', description: 'Farmer has started the order.', timestamp: new Date() }],
    });

    // Atomic decrement: only succeeds if quantity is still sufficient (race-condition safe)
    const updatedCrop = await CropListing.findOneAndUpdate(
      { _id: cropId, quantity: { $gte: orderQty } },
      {
        $inc: { quantity: -orderQty, sold: orderQty },
        $set: { 'interestedBuyers.$[elem].status': 'ordered', 'interestedBuyers.$[elem].orderId': order._id },
      },
      { arrayFilters: [{ 'elem.buyerId': buyerId }], new: true },
    );
    if (!updatedCrop) {
      await Order.findByIdAndDelete(order._id);
      sendError(res, 'Insufficient stock — the crop quantity changed before your order was confirmed', 400);
      return;
    }
    if (updatedCrop.quantity <= 0) {
      await CropListing.findByIdAndUpdate(cropId, { availability: CropAvailability.NotAvailable });
    }

    try {
      await Notification.create({
        userId: buyerId, title: 'Order Started by Farmer', message: `Farmer has started order #${order.orderNumber} for "${crop.cropName}".`,
        type: 'order', relatedId: String(order._id), priority: 'high', actionUrl: `/buyer/orders/${order._id}`,
        data: { orderId: order._id, orderNumber: order.orderNumber, cropName: crop.cropName, farmerId: req.user!._id },
      });
    } catch (notifErr) {
      console.error('Failed to create start order notification:', notifErr);
    }

    notifyOrderUpdate(order, 'order:created');
    res.status(201).json({ message: 'Order started successfully! Buyer has been notified.', order });
  } catch (error) {
    next(error);
  }
}

export async function createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cropId, quantity, couponCode, paymentMethod: requestedMethod } = req.body as {
      cropId: string; quantity?: number; couponCode?: string; paymentMethod?: PaymentMethod;
    };

    const paymentMethod = requestedMethod === PaymentMethod.Razorpay ? PaymentMethod.Razorpay : PaymentMethod.Cod;
    if (!cropId) {
      sendError(res, 'Crop ID is required', 400);
      return;
    }

    const crop = await CropListing.findById(cropId);
    if (!crop) {
      sendError(res, 'Crop not found', 404);
      return;
    }
    if (crop.availability !== CropAvailability.Available) {
      sendError(res, 'This crop is no longer available', 400);
      return;
    }
    if (crop.quantity < (quantity || 1)) {
      sendError(res, `Insufficient quantity. Available: ${crop.quantity} ${crop.unit}`, 400);
      return;
    }

    const interestEntry = crop.interestedBuyers.find((ib) => ib.buyerId.toString() === req.user!._id.toString());
    if (!interestEntry) {
      sendError(res, 'You must mark interest in this crop before placing an order', 400);
      return;
    }

    const orderQty = quantity || 1;
    const baseAmount = crop.price * orderQty;
    let discountAmount = 0;
    let totalAmount = baseAmount;
    let appliedCouponCode: string | null = null;

    if (couponCode && couponCode.trim()) {
      const coupon = await Coupon.findOne({ code: couponCode.trim().toUpperCase(), isActive: true });
      if (!coupon) {
        sendError(res, 'Invalid or expired coupon code', 400);
        return;
      }
      const now = new Date();
      if (coupon.validFrom && now < coupon.validFrom) { sendError(res, 'This coupon is not active yet', 400); return; }
      if (coupon.validUntil && now > coupon.validUntil) { sendError(res, 'This coupon has expired', 400); return; }
      if (coupon.usageLimit !== null && coupon.usageLimit !== undefined && coupon.usedCount >= coupon.usageLimit) { sendError(res, 'This coupon has reached its usage limit', 400); return; }
      const userUses = coupon.usedBy.filter((id) => id.toString() === req.user!._id.toString()).length;
      if (userUses >= coupon.perUserLimit) { sendError(res, 'You have already used this coupon', 400); return; }

      const result = computeDiscount(coupon, baseAmount);
      if (!result) { sendError(res, `Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon`, 400); return; }
      discountAmount = result.discountAmount;
      totalAmount = result.finalAmount;
      appliedCouponCode = coupon.code;
    }

    const order = await Order.create({
      orderNumber: 'ORD-' + randomUUID().replace(/-/g, '').substring(0, 12).toUpperCase(),
      buyerId: req.user!._id,
      farmerId: crop.farmerId,
      cropId: crop._id,
      cropName: crop.cropName,
      quantity: orderQty,
      unitPrice: crop.price,
      originalAmount: baseAmount,
      discountAmount,
      couponCode: appliedCouponCode,
      totalAmount,
      pickupLocation: crop.pickupLocation,
      farmerContact: crop.contactNumber,
      buyerContact: '',
      paymentMethod,
      paymentStatus: PaymentStatus.Pending,
      orderStatus: OrderStatus.Confirmed,
      timeline: [{ event: 'ORDER_CONFIRMED', description: 'Order confirmed. Farmer will prepare your order.', timestamp: new Date() }],
    });

    if (appliedCouponCode) await redeemCoupon(appliedCouponCode, req.user!._id);

    // Atomic decrement: guards against concurrent orders exhausting stock
    const updatedCrop = await CropListing.findOneAndUpdate(
      { _id: cropId, quantity: { $gte: orderQty } },
      {
        $inc: { quantity: -orderQty, sold: orderQty },
        $set: { 'interestedBuyers.$[elem].status': 'ordered', 'interestedBuyers.$[elem].orderId': order._id },
      },
      { arrayFilters: [{ 'elem.buyerId': req.user!._id }], new: true },
    );
    if (!updatedCrop) {
      await Order.findByIdAndDelete(order._id);
      sendError(res, 'Insufficient stock — this crop sold out before your order was confirmed', 400);
      return;
    }
    if (updatedCrop.quantity <= 0) {
      await CropListing.findByIdAndUpdate(cropId, { availability: CropAvailability.NotAvailable });
    }

    try {
      await Notification.create({
        userId: crop.farmerId,
        title: 'New Order Received',
        message: `You have a new order for ${orderQty} ${crop.unit} of ${crop.cropName}.`,
        type: 'order',
        relatedId: String(order._id),
        priority: 'high',
        actionUrl: `/farmer/orders/${order._id}`,
        data: { orderId: order._id, cropId: crop._id, orderNumber: order.orderNumber, buyerId: req.user!._id },
      });
    } catch (notifErr) {
      console.error('Failed to create order notification:', notifErr);
    }

    notifyOrderUpdate(order, 'order:created');
    res.status(201).json({ message: 'Order placed successfully! Farmer will start preparing your order.', order });
  } catch (error) {
    next(error);
  }
}

export async function checkoutCart(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { items, couponCode, paymentMethod: requestedMethod } = req.body as {
      items: { cropId: string; quantity?: number; unitPrice?: number }[];
      couponCode?: string;
      paymentMethod?: PaymentMethod;
    };

    if (!items || items.length === 0) {
      sendError(res, 'Cart is empty', 400);
      return;
    }

    const paymentMethod = requestedMethod === PaymentMethod.Razorpay ? PaymentMethod.Razorpay : PaymentMethod.Cod;
    const buyerId = req.user!._id;

    const cropIds = items.map((i) => i.cropId);
    const crops = await CropListing.find({ _id: { $in: cropIds } });
    if (crops.length !== items.length) {
      sendError(res, 'One or more crops in the cart were not found', 404);
      return;
    }

    let totalBaseAmount = 0;
    const validatedItems = items.map((item) => {
      const crop = crops.find((c) => String(c._id) === item.cropId);
      if (!crop) throw new Error('Crop not found');
      
      if (crop.availability !== CropAvailability.Available) {
        throw new Error(`Crop ${crop.cropName} is no longer available`);
      }
      
      const orderQty = item.quantity || 1;
      if (crop.quantity < orderQty) {
        throw new Error(`Insufficient quantity for ${crop.cropName}. Available: ${crop.quantity} ${crop.unit}`);
      }
      
      const itemBaseAmount = crop.price * orderQty;
      totalBaseAmount += itemBaseAmount;

      return { crop, orderQty, itemBaseAmount };
    });

    const cartSize = validatedItems.length;
    const volumeDiscountPercent = cartSize >= 3 ? 10 : cartSize >= 2 ? 5 : 0;
    const volumeDiscountAmount = (totalBaseAmount * volumeDiscountPercent) / 100;
    const amountAfterVolume = totalBaseAmount - volumeDiscountAmount;

    let totalCouponDiscount = 0;
    let appliedCouponCode: string | null = null;

    if (couponCode && couponCode.trim()) {
      const couponDoc = await Coupon.findOne({ code: couponCode.trim().toUpperCase(), isActive: true });
      if (!couponDoc) {
        sendError(res, 'Invalid or expired coupon code', 400);
        return;
      }
      const now = new Date();
      if (couponDoc.validFrom && now < couponDoc.validFrom) { sendError(res, 'This coupon is not active yet', 400); return; }
      if (couponDoc.validUntil && now > couponDoc.validUntil) { sendError(res, 'This coupon has expired', 400); return; }
      if (couponDoc.usageLimit !== null && couponDoc.usageLimit !== undefined && couponDoc.usedCount >= couponDoc.usageLimit) { sendError(res, 'This coupon has reached its usage limit', 400); return; }
      const userUses = couponDoc.usedBy.filter((id) => id.toString() === buyerId.toString()).length;
      if (userUses >= couponDoc.perUserLimit) { sendError(res, 'You have already used this coupon', 400); return; }

      const result = computeDiscount(couponDoc, amountAfterVolume);
      if (!result) { sendError(res, `Minimum order amount of ₹${couponDoc.minOrderAmount} required for this coupon`, 400); return; }
      
      totalCouponDiscount = result.discountAmount;
      appliedCouponCode = couponDoc.code;
    }

    const totalDiscountAmount = volumeDiscountAmount + totalCouponDiscount;
    const createdOrderIds: string[] = [];

    for (const item of validatedItems) {
      const itemShareRatio = item.itemBaseAmount / totalBaseAmount;
      const itemDiscount = Math.round(totalDiscountAmount * itemShareRatio * 100) / 100;
      const itemFinalTotal = item.itemBaseAmount - itemDiscount;

      const order = await Order.create({
        orderNumber: 'ORD-' + randomUUID().replace(/-/g, '').substring(0, 12).toUpperCase(),
        buyerId,
        farmerId: item.crop.farmerId,
        cropId: item.crop._id,
        cropName: item.crop.cropName,
        quantity: item.orderQty,
        unitPrice: item.crop.price,
        originalAmount: item.itemBaseAmount,
        discountAmount: itemDiscount,
        couponCode: appliedCouponCode,
        totalAmount: Math.max(0, Math.round(itemFinalTotal * 100) / 100),
        pickupLocation: item.crop.pickupLocation,
        farmerContact: item.crop.contactNumber,
        buyerContact: '',
        paymentMethod,
        paymentStatus: PaymentStatus.Pending,
        orderStatus: OrderStatus.Confirmed,
        timeline: [{ event: 'ORDER_CONFIRMED', description: 'Order confirmed. Farmer will prepare your order.', timestamp: new Date() }],
      });

      const updatedCrop = await CropListing.findOneAndUpdate(
        { _id: item.crop._id, quantity: { $gte: item.orderQty } },
        {
          $inc: { quantity: -item.orderQty, sold: item.orderQty },
          $set: { 'interestedBuyers.$[elem].status': 'ordered', 'interestedBuyers.$[elem].orderId': order._id },
        },
        { arrayFilters: [{ 'elem.buyerId': buyerId }], new: true },
      );
      
      if (!updatedCrop) {
        throw new Error(`Insufficient stock for ${item.crop.cropName}`);
      }
      if (updatedCrop.quantity <= 0) {
        await CropListing.findByIdAndUpdate(item.crop._id, { availability: CropAvailability.NotAvailable });
      }

      createdOrderIds.push(String(order._id));

      try {
        await Notification.create({
          userId: item.crop.farmerId,
          title: 'New Order Received',
          message: `You have a new order for ${item.orderQty} ${item.crop.unit} of ${item.crop.cropName}.`,
          type: 'order',
          relatedId: String(order._id),
          priority: 'high',
          actionUrl: `/farmer/orders/${order._id}`,
          data: { orderId: order._id, cropId: item.crop._id, orderNumber: order.orderNumber, buyerId },
        });
      } catch (notifErr) {
        console.error('Failed to create order notification:', notifErr);
      }
      notifyOrderUpdate(order, 'order:created');
    }

    if (appliedCouponCode) {
      await redeemCoupon(appliedCouponCode, buyerId);
    }

    res.status(201).json({
      message: 'Cart checkout successful',
      orderIds: createdOrderIds,
    });
  } catch (error: any) {
    if (error.message && (error.message.includes('Crop not found') || error.message.includes('no longer available') || error.message.includes('Insufficient stock') || error.message.includes('Insufficient quantity'))) {
      sendError(res, error.message, 400);
      return;
    }
    next(error);
  }
}

export async function getOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, page = '1', limit = '10' } = req.query as Record<string, string>;
    const query: Record<string, unknown> = {};

    if (req.user!.role === 'farmer') query.farmerId = req.user!._id;
    else if (req.user!.role === 'buyer') query.buyerId = req.user!._id;
    if (status) query.orderStatus = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(query).lean()
        .populate('cropId', 'cropName images price unit')
        .populate('buyerId', 'firstName lastName name phone email city state')
        .populate('farmerId', 'firstName lastName name phone farmName city state')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Order.countDocuments(query),
    ]);

    res.status(200).json({
      orders,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
}

export async function getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await Order.findById(req.params.id).lean()
      .populate('cropId')
      .populate('buyerId', 'firstName lastName name phone email city state avatar')
      .populate('farmerId', 'firstName lastName name phone farmName city state avatar');

    if (!order) {
      sendError(res, 'Order not found', 404);
      return;
    }

    const isBuyer = (order.buyerId as { _id: { toString: () => string } })._id.toString() === req.user!._id.toString();
    const isFarmer = (order.farmerId as { _id: { toString: () => string } })._id.toString() === req.user!._id.toString();
    const isAdmin = req.user!.role === 'admin';
    if (!isBuyer && !isFarmer && !isAdmin) {
      sendError(res, 'Not authorized to view this order', 403);
      return;
    }
    res.status(200).json({ order });
  } catch (error) {
    next(error);
  }
}

export async function updateOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status } = req.body as { status: OrderStatus };
    if (!VALID_STATUSES.includes(status)) {
      sendError(res, `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 400);
      return;
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      sendError(res, 'Order not found', 404);
      return;
    }

    const isFarmer = order.farmerId.toString() === req.user!._id.toString();
    const isBuyer = order.buyerId.toString() === req.user!._id.toString();
    const isAdmin = req.user!.role === 'admin';

    // Buyers can only mark an order as PickedUp (from ReadyForPickup).
    // Cancellations must go through the dedicated cancelOrder endpoint.
    const isBuyerTransition = isBuyer
      && order.orderStatus === OrderStatus.ReadyForPickup
      && BUYER_ALLOWED_TARGET_STATUSES.includes(status);
    if (!isFarmer && !isAdmin && !isBuyerTransition) {
      sendError(res, 'Not authorized to update this order status', 403);
      return;
    }

    if (!VALID_TRANSITIONS[order.orderStatus]?.includes(status)) {
      sendError(res, `Cannot transition from "${order.orderStatus}" to "${status}"`, 400);
      return;
    }

    order.orderStatus = status;
    order.timeline.push({ event: status.toUpperCase(), description: STATUS_DESCRIPTIONS[status] || `Order status updated to ${status}`, timestamp: new Date() });

    if (status === OrderStatus.Completed) {
      order.completedAt = new Date();
      order.paymentStatus = PaymentStatus.Completed;
      await recordCropCompletion(order);
    }

    await order.save();

    try {
      await Notification.create({
        userId: order.buyerId, title: 'Order Status Updated', message: `Your order #${order.orderNumber} is now "${status}". ${STATUS_DESCRIPTIONS[status] || ''}`,
        type: 'order', relatedId: String(order._id), priority: 'medium', actionUrl: `/buyer/orders/${order._id}`,
        data: { orderId: order._id, orderNumber: order.orderNumber, status },
      });
    } catch (notifErr) {
      console.error('Failed to create status notification:', notifErr);
    }

    notifyOrderUpdate(order, 'order:statusUpdated');
    res.status(200).json({ message: `Order status updated to "${status}"`, order });
  } catch (error) {
    next(error);
  }
}

export async function addOrderReview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { rating, review: reviewText } = req.body as { rating: number; review: string };
    const order = await Order.findById(req.params.id);
    if (!order) {
      sendError(res, 'Order not found', 404);
      return;
    }
    if (order.buyerId.toString() !== req.user!._id.toString()) {
      sendError(res, 'Only the buyer can review this order', 403);
      return;
    }
    if (order.orderStatus !== OrderStatus.Completed) {
      sendError(res, 'Can only review completed orders', 400);
      return;
    }
    order.review = { rating, comment: reviewText, reviewedAt: new Date() };
    await order.save();
    res.status(200).json({ message: 'Review added successfully', order });
  } catch (error) {
    next(error);
  }
}

export async function cancelOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cancellationReason } = req.body as { cancellationReason: string };
    const order = await Order.findById(req.params.id);
    if (!order) {
      sendError(res, 'Order not found', 404);
      return;
    }

    const isBuyer = order.buyerId.toString() === req.user!._id.toString();
    const isFarmer = order.farmerId.toString() === req.user!._id.toString();
    const isAdmin = req.user!.role === 'admin';
    if (!isBuyer && !isFarmer && !isAdmin) {
      sendError(res, 'Not authorized to cancel this order', 403);
      return;
    }
    if ([OrderStatus.Completed, OrderStatus.Cancelled].includes(order.orderStatus)) {
      sendError(res, `Cannot cancel an order that is already "${order.orderStatus}"`, 400);
      return;
    }
    if (!cancellationReason || cancellationReason.trim().length < 5) {
      sendError(res, 'Please provide a valid cancellation reason (at least 5 characters)', 400);
      return;
    }

    const cancelledBy: CancelledBy = isAdmin ? CancelledBy.Admin : isFarmer ? CancelledBy.Farmer : CancelledBy.Buyer;
    order.orderStatus = OrderStatus.Cancelled;
    order.cancellationReason = cancellationReason.trim();
    order.cancelledBy = cancelledBy;
    order.cancelledAt = new Date();
    order.timeline.push({ event: 'CANCELLED', description: `Order cancelled by ${cancelledBy}. Reason: ${cancellationReason.trim()}`, timestamp: new Date() });
    await order.save();

    // Restore stock atomically; only reactivate listing if it was previously active
    // (don't override a farmer's manual deactivation)
    const cropForCancel = await CropListing.findById(order.cropId).select('status availability').lean();
    const wasActive = cropForCancel?.status === CropStatus.Active || cropForCancel?.status === CropStatus.SoldOut;
    const restoreSet: Record<string, unknown> = {};
    if (wasActive) {
      restoreSet.availability = CropAvailability.Available;
      restoreSet.status = CropStatus.Active;
    }
    await CropListing.findByIdAndUpdate(order.cropId, {
      $inc: { quantity: order.quantity, sold: -order.quantity },
      ...(Object.keys(restoreSet).length > 0 ? { $set: restoreSet } : {}),
    });

    const notifyUserId = isFarmer ? order.buyerId : order.farmerId;
    try {
      await Notification.create({
        userId: notifyUserId, title: 'Order Cancelled', message: `Order #${order.orderNumber} for "${order.cropName}" has been cancelled. Reason: ${cancellationReason.trim()}`,
        type: 'order', relatedId: String(order._id), priority: 'high',
        actionUrl: isFarmer ? `/buyer/orders/${order._id}` : `/farmer/orders/${order._id}`,
        data: { orderId: order._id, orderNumber: order.orderNumber, cancelledBy, reason: cancellationReason.trim() },
      });
    } catch (notifErr) {
      console.error('Failed to create cancel notification:', notifErr);
    }

    notifyOrderUpdate(order, 'order:cancelled');
    res.status(200).json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    next(error);
  }
}

export async function getOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await Order.findById(req.params.id).lean().select('orderStatus orderNumber timeline');
    if (!order) {
      sendError(res, 'Order not found', 404);
      return;
    }
    res.status(200).json({ status: order.orderStatus, orderNumber: order.orderNumber, timeline: order.timeline });
  } catch (error) {
    next(error);
  }
}

export async function trackOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await Order.findById(req.params.id).lean()
      .select('orderNumber orderStatus timeline pickupLocation farmerContact buyerContact cropName quantity unitPrice totalAmount')
      .populate('farmerId', 'firstName lastName name phone farmName')
      .populate('buyerId', 'firstName lastName name phone');
    if (!order) {
      sendError(res, 'Order not found', 404);
      return;
    }
    res.status(200).json({ order });
  } catch (error) {
    next(error);
  }
}

export async function getOrderStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query: Record<string, unknown> = {};
    if (req.user!.role === 'farmer') query.farmerId = req.user!._id;
    else if (req.user!.role === 'buyer') query.buyerId = req.user!._id;

    const [totalOrders, completedOrders, pendingOrders, cancelledOrders] = await Promise.all([
      Order.countDocuments(query),
      Order.countDocuments({ ...query, orderStatus: OrderStatus.Completed }),
      Order.countDocuments({ ...query, orderStatus: { $in: [OrderStatus.Confirmed, OrderStatus.Preparing, OrderStatus.ReadyForPickup, OrderStatus.PickedUp] } }),
      Order.countDocuments({ ...query, orderStatus: OrderStatus.Cancelled }),
    ]);

    const revenueData = await Order.aggregate([
      { $match: { ...query, orderStatus: OrderStatus.Completed } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

    res.status(200).json({
      stats: { totalOrders, completedOrders, pendingOrders, cancelledOrders, totalRevenue },
    });
  } catch (error) {
    next(error);
  }
}

export async function denyOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { denialReason } = req.body as { denialReason: string };
    const order = await Order.findById(req.params.id);
    if (!order) {
      sendError(res, 'Order not found', 404);
      return;
    }
    if (order.farmerId.toString() !== req.user!._id.toString()) {
      sendError(res, 'Not authorized to deny this order', 403);
      return;
    }
    if ([OrderStatus.Completed, OrderStatus.Cancelled].includes(order.orderStatus)) {
      sendError(res, `Cannot deny an order that is already "${order.orderStatus}"`, 400);
      return;
    }
    if (!denialReason || denialReason.trim().length < 5) {
      sendError(res, 'Please provide a valid denial reason (at least 5 characters)', 400);
      return;
    }

    order.orderStatus = OrderStatus.Cancelled;
    order.cancellationReason = `Denied by farmer: ${denialReason.trim()}`;
    order.cancelledBy = CancelledBy.Farmer;
    order.cancelledAt = new Date();
    order.timeline.push({ event: 'DENIED', description: `Order denied by farmer. Reason: ${denialReason.trim()}`, timestamp: new Date() });
    await order.save();

    // Same smart restore: only reactivate if listing was active/soldOut before
    const cropForDeny = await CropListing.findById(order.cropId).select('status').lean();
    const wasActiveForDeny = cropForDeny?.status === CropStatus.Active || cropForDeny?.status === CropStatus.SoldOut;
    const denyRestoreSet: Record<string, unknown> = {};
    if (wasActiveForDeny) {
      denyRestoreSet.availability = CropAvailability.Available;
      denyRestoreSet.status = CropStatus.Active;
    }
    await CropListing.findByIdAndUpdate(order.cropId, {
      $inc: { quantity: order.quantity, sold: -order.quantity },
      ...(Object.keys(denyRestoreSet).length > 0 ? { $set: denyRestoreSet } : {}),
    });

    try {
      await Notification.create({
        userId: order.buyerId, title: 'Order Denied by Farmer', message: `Your order #${order.orderNumber} for "${order.cropName}" has been denied by the farmer. Reason: ${denialReason.trim()}`,
        type: 'order', relatedId: String(order._id), priority: 'high', actionUrl: `/buyer/orders/${order._id}`,
        data: { orderId: order._id, orderNumber: order.orderNumber, deniedBy: 'farmer', reason: denialReason.trim() },
      });
    } catch (notifErr) {
      console.error('Failed to create denial notification:', notifErr);
    }

    notifyOrderUpdate(order, 'order:cancelled');
    res.status(200).json({ message: 'Order denied successfully', order });
  } catch (error) {
    next(error);
  }
}

export async function markOrderReceived(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      sendError(res, 'Order not found', 404);
      return;
    }
    if (order.buyerId.toString() !== req.user!._id.toString()) {
      sendError(res, 'Not authorized to mark this order as received', 403);
      return;
    }
    if (order.orderStatus !== OrderStatus.PickedUp) {
      sendError(res, `Order must be in "picked_up" status to mark as received. Current status: "${order.orderStatus}"`, 400);
      return;
    }

    order.orderStatus = OrderStatus.Completed;
    order.completedAt = new Date();
    order.paymentStatus = PaymentStatus.Completed;
    order.timeline.push({ event: 'RECEIVED', description: 'Order marked as received by buyer', timestamp: new Date() });
    await order.save();

    await recordCropCompletion(order);

    try {
      await Notification.create({
        userId: order.farmerId, title: 'Order Received', message: `Order #${order.orderNumber} for "${order.cropName}" has been marked as received by the buyer. Payment of ₹${order.totalAmount} is now due.`,
        type: 'order', relatedId: String(order._id), priority: 'high', actionUrl: `/farmer/orders/${order._id}`,
        data: { orderId: order._id, orderNumber: order.orderNumber, status: 'completed' },
      });
    } catch (notifErr) {
      console.error('Failed to create received notification:', notifErr);
    }

    notifyOrderUpdate(order, 'order:statusUpdated');
    res.status(200).json({ message: 'Order marked as received successfully', order });
  } catch (error) {
    next(error);
  }
}

// ---------------- COD Payment Endpoints (Task 1.4) ----------------

export async function markCODPaymentReceived(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { amount, notes } = req.body;
    const order = await Order.findById(id);
    
    if (!order) { sendError(res, 'Order not found', 404); return; }
    
    // Only farmer (or admin) who owns the order can mark COD as received
    if (req.user!.role !== UserRole.Admin && order.farmerId.toString() !== req.user!._id.toString()) {
      sendError(res, 'Not authorized', 403);
      return;
    }
    
    if (order.paymentMethod !== PaymentMethod.Cod) {
      sendError(res, 'Order is not a COD order', 400);
      return;
    }
    
    order.paymentStatus = PaymentStatus.Completed;
    order.timeline.push({ 
      event: 'PAYMENT_RECEIVED', 
      description: `COD payment received${notes ? ': ' + notes : ''}`, 
      timestamp: new Date() 
    });
    
    await order.save();
    res.status(200).json({ success: true, message: 'COD payment marked as received', order });
  } catch (error) {
    next(error);
  }
}

export async function getCODPaymentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).select('paymentStatus paymentMethod totalAmount');
    if (!order) { sendError(res, 'Order not found', 404); return; }
    res.status(200).json({ success: true, paymentStatus: order.paymentStatus, paymentMethod: order.paymentMethod, amount: order.totalAmount });
  } catch (error) {
    next(error);
  }
}

export async function getPendingCODPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const farmerId = req.user!._id;
    const orders = await Order.find({
      farmerId,
      paymentMethod: PaymentMethod.Cod,
      paymentStatus: { $ne: PaymentStatus.Completed }
    }).sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
}
