import crypto from 'crypto';
import Order from '../models/Order.js';
import Notification from '../models/Notification.js';
import { getRazorpayInstance, isRazorpayConfigured } from '../config/razorpay.js';
import { notifyOrderUpdate } from '../socket/eventHandlers.js';
import { sendError } from '../utils/apiResponse.js';
import { env } from '../config/env.js';
import { PaymentMethod, PaymentStatus, OrderStatus } from '../types/enums.js';
import type { Request, Response, NextFunction } from 'express';

import { createCircuitBreaker } from '../utils/circuitBreaker.js';

export const VALID_PAYMENT_METHODS = [PaymentMethod.Cod, PaymentMethod.Razorpay];

const razorpayCreateOrder = (razorpayInstance: any, options: any) => {
  return razorpayInstance.orders.create(options);
};
const razorpayBreaker = createCircuitBreaker(razorpayCreateOrder);

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

    const unpaidOrders = orders.filter((o) => o.paymentStatus !== PaymentStatus.Completed && o.orderStatus !== OrderStatus.Cancelled);
    if (unpaidOrders.length === 0) { sendError(res, 'All selected orders are already paid', 400); return; }

    const totalAmount = unpaidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    if (totalAmount <= 0) { sendError(res, 'Invalid payment amount', 400); return; }

    const targetIds = unpaidOrders.map((o) => o._id);
    const receipt = `rcpt_${String(targetIds[0]).slice(-12)}`;

    const razorpayOrder = await razorpayBreaker.fire(razorpay, {
      amount: Math.round(totalAmount * 100),
      currency: 'INR',
      receipt,
      notes: { orderIds: targetIds.map((id) => String(id)).join(','), buyerId: String(req.user!._id) },
    }) as any;

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

    const allCompleted = orders.every((o) => o.paymentStatus === PaymentStatus.Completed);
    if (allCompleted) {
      res.status(200).json({ message: 'Payment verified successfully', orderIds: orders.map((o) => String(o._id)) });
      return;
    }

    await Order.updateMany(
      { _id: { $in: orders.map((o) => o._id) }, paymentStatus: { $ne: PaymentStatus.Completed } },
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

export async function handleRazorpayWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const webhookSecret = env.razorpayWebhookSecret;
    if (!webhookSecret) {
      console.warn('[Webhook] Razorpay webhook secret is not configured in environment variables');
      sendError(res, 'Webhook secret not configured on server', 500);
      return;
    }

    const signature = req.headers['x-razorpay-signature'] as string | undefined;
    if (!signature) {
      sendError(res, 'Missing x-razorpay-signature header', 400);
      return;
    }

    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.warn('[Webhook] Razorpay signature verification failed');
      sendError(res, 'Invalid webhook signature', 400);
      return;
    }

    const event = req.body?.event as string | undefined;
    const payload = req.body?.payload;

    if (!event || !payload) {
      res.status(200).json({ status: 'ignored', message: 'No event or payload found' });
      return;
    }

    if (event === 'payment.captured' || event === 'order.paid') {
      const payment = payload.payment?.entity;
      const razorpayOrderId = payment?.order_id || payload.order?.entity?.id;
      const razorpayPaymentId = payment?.id;

      if (!razorpayOrderId) {
        res.status(200).json({ status: 'ignored', message: 'No order ID in payload' });
        return;
      }

      const orders = await Order.find({ razorpayOrderId });
      if (orders.length === 0) {
        console.warn(`[Webhook] No matching orders found for razorpayOrderId: ${razorpayOrderId}`);
        res.status(200).json({ status: 'ignored', message: 'Orders not found' });
        return;
      }

      // Idempotency: skip if already completed
      const allDone = orders.every((o) => o.paymentStatus === PaymentStatus.Completed);
      if (allDone) {
        res.status(200).json({ status: 'ok', message: 'Orders already marked as completed' });
        return;
      }

      const pendingOrders = orders.filter((o) => o.paymentStatus !== PaymentStatus.Completed);
      const pendingIds = pendingOrders.map((o) => o._id);

      await Order.updateMany(
        { _id: { $in: pendingIds } },
        {
          $set: {
            paymentStatus: PaymentStatus.Completed,
            ...(razorpayPaymentId ? { razorpayPaymentId } : {}),
            razorpaySignature: signature,
          },
          $push: {
            timeline: {
              event: 'PAYMENT_COMPLETED',
              description: `Payment confirmed via Razorpay webhook (${event})`,
              timestamp: new Date(),
            },
          },
        },
      );

      for (const order of pendingOrders) {
        try {
          await Notification.create({
            userId: order.farmerId,
            title: 'Payment Received',
            message: `Payment of ₹${order.totalAmount} received for order #${order.orderNumber} (${order.cropName}).`,
            type: 'order',
            relatedId: String(order._id),
            priority: 'high',
            actionUrl: `/farmer/orders/${order._id}`,
            data: { orderId: order._id, orderNumber: order.orderNumber, paymentMethod: 'razorpay' },
          });
          notifyOrderUpdate(order, 'order:statusUpdated');
        } catch (notifErr) {
          console.error('[Webhook] Failed to create payment notification:', notifErr);
        }
      }

      res.status(200).json({ status: 'ok', message: 'Orders updated to completed', count: pendingIds.length });
      return;
    }

    if (event === 'payment.failed') {
      const payment = payload.payment?.entity;
      const razorpayOrderId = payment?.order_id;
      const errorDesc = payment?.error_description || 'Online payment failed';

      if (razorpayOrderId) {
        await Order.updateMany(
          { razorpayOrderId, paymentStatus: { $ne: PaymentStatus.Completed } },
          {
            $set: { paymentStatus: PaymentStatus.Failed },
            $push: {
              timeline: {
                event: 'PAYMENT_FAILED',
                description: `Payment failed via webhook: ${errorDesc}`,
                timestamp: new Date(),
              },
            },
          },
        );
      }
      res.status(200).json({ status: 'ok', event: 'payment.failed' });
      return;
    }

    res.status(200).json({ status: 'ok', message: `Unhandled event ${event} acknowledged` });
  } catch (error) {
    next(error);
  }
}
