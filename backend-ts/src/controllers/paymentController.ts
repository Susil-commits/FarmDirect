import crypto from 'crypto';
import Order from '../models/Order.js';
import Notification from '../models/Notification.js';
import { getRazorpayInstance, isRazorpayConfigured } from '../config/razorpay.js';
import { notifyOrderUpdate } from '../socket/eventHandlers.js';
import { sendError } from '../utils/apiResponse.js';
import { env } from '../config/env.js';
import { PaymentMethod, PaymentStatus } from '../types/enums.js';
import type { Request, Response, NextFunction } from 'express';

export const VALID_PAYMENT_METHODS = [PaymentMethod.Cod, PaymentMethod.Razorpay];

export async function createRazorpayOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!isRazorpayConfigured()) {
      sendError(res, 'Razorpay is not configured on the server', 500);
      return;
    }
    const razorpay = getRazorpayInstance()!;
    const { orderId, orderIds } = req.body as { orderId?: string; orderIds?: string[] };

    let ids: string[] = [];
    if (Array.isArray(orderIds) && orderIds.length > 0) ids = orderIds;
    else if (orderId) ids = [orderId];
    else { sendError(res, 'orderId or orderIds is required', 400); return; }

    const orders = await Order.find({ _id: { $in: ids }, buyerId: req.user!._id });
    if (orders.length === 0) { sendError(res, 'No matching orders found for this buyer', 404); return; }

    const unpaidOrders = orders.filter((o) => o.paymentStatus !== PaymentStatus.Completed);
    if (unpaidOrders.length === 0) { sendError(res, 'All selected orders are already paid', 400); return; }

    const totalAmount = unpaidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    if (totalAmount <= 0) { sendError(res, 'Invalid payment amount', 400); return; }

    const targetIds = unpaidOrders.map((o) => o._id);
    const receipt = `rcpt_${String(targetIds[0]).slice(-12)}`;

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: 'INR',
      receipt,
      notes: { orderIds: targetIds.map((id) => String(id)).join(','), buyerId: String(req.user!._id) },
    });

    await Order.updateMany(
      { _id: { $in: targetIds } },
      { $set: { razorpayOrderId: razorpayOrder.id, paymentMethod: PaymentMethod.Razorpay } },
    );

    res.status(200).json({
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: env.razorpayKeyId,
      orderIds: targetIds.map((id) => String(id)),
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyRazorpayPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body as {
      razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string;
    };
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      sendError(res, 'Missing payment verification details', 400);
      return;
    }

    const expectedSignature = crypto
      .createHmac('sha256', env.razorpayKeySecret!)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      await Order.updateMany({ razorpayOrderId, buyerId: req.user!._id }, { $set: { paymentStatus: PaymentStatus.Failed } });
      sendError(res, 'Payment verification failed: invalid signature', 400);
      return;
    }

    const orders = await Order.find({ razorpayOrderId, buyerId: req.user!._id });
    if (orders.length === 0) { sendError(res, 'No orders found for this payment', 404); return; }

    await Order.updateMany(
      { _id: { $in: orders.map((o) => o._id) } },
      {
        $set: { paymentStatus: PaymentStatus.Completed, razorpayPaymentId, razorpaySignature },
        $push: { timeline: { event: 'PAYMENT_COMPLETED', description: 'Online payment verified via Razorpay', timestamp: new Date() } },
      },
    );

    for (const order of orders) {
      try {
        await Notification.create({
          userId: order.farmerId, title: 'Payment Received', message: `Payment of ₹${order.totalAmount} received for order #${order.orderNumber} (${order.cropName}).`,
          type: 'order', relatedId: String(order._id), priority: 'high', actionUrl: `/farmer/orders/${order._id}`,
          data: { orderId: order._id, orderNumber: order.orderNumber, paymentMethod: 'razorpay' },
        });
        notifyOrderUpdate(order, 'order:statusUpdated');
      } catch (notifErr) {
        console.error('Failed to create payment notification:', notifErr);
      }
    }

    res.status(200).json({ message: 'Payment verified successfully', orderIds: orders.map((o) => String(o._id)) });
  } catch (error) {
    next(error);
  }
}

export async function markRazorpayPaymentFailed(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { razorpayOrderId, reason } = req.body as { razorpayOrderId: string; reason?: string };
    if (!razorpayOrderId) { sendError(res, 'razorpayOrderId is required', 400); return; }

    const result = await Order.updateMany(
      { razorpayOrderId, buyerId: req.user!._id, paymentStatus: { $ne: PaymentStatus.Completed } },
      {
        $set: { paymentStatus: PaymentStatus.Failed },
        $push: { timeline: { event: 'PAYMENT_FAILED', description: reason || 'Online payment failed', timestamp: new Date() } },
      },
    );
    res.status(200).json({ message: 'Payment marked as failed', modifiedCount: result.modifiedCount });
  } catch (error) {
    next(error);
  }
}
