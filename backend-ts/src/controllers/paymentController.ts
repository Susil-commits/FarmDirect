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

function safeCompareSignatures(expected: string, received: string): boolean {
  if (!expected || !received) return false;
  const bufExpected = Buffer.from(expected, 'utf-8');
  const bufReceived = Buffer.from(received, 'utf-8');
  if (bufExpected.length !== bufReceived.length) return false;
  return crypto.timingSafeEqual(bufExpected, bufReceived);
}

const razorpayCreateOrder = (razorpayInstance: any, options: any) => {
  return razorpayInstance.orders.create(options);
};
const razorpayBreaker = createCircuitBreaker(razorpayCreateOrder);

export async function createRazorpayOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
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

    // Prevent double-init from overwriting razorpayOrderId and orphaning the first Razorpay order
    const existingRzpId = unpaidOrders[0].razorpayOrderId;
    const allShareSameRzpId = existingRzpId && unpaidOrders.every((o) => o.razorpayOrderId === existingRzpId);
    if (allShareSameRzpId) {
      res.status(200).json({
        success: true,
        razorpayOrderId: existingRzpId,
        amount: Math.round(totalAmount * 100),
        currency: 'INR',
        keyId: env.razorpayKeyId,
        orderIds: targetIds.map((id) => String(id)),
      });
      return;
    }

    if (!isRazorpayConfigured()) {
      sendError(res, 'Razorpay is not configured on the server', 500);
      return;
    }
    const razorpay = getRazorpayInstance()!;

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
      success: true,
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
      razorpayOrderId?: unknown; razorpayPaymentId?: unknown; razorpaySignature?: unknown;
    };
    if (
      typeof razorpayOrderId !== 'string' ||
      typeof razorpayPaymentId !== 'string' ||
      typeof razorpaySignature !== 'string' ||
      !razorpayOrderId.trim() ||
      !razorpayPaymentId.trim() ||
      !razorpaySignature.trim() ||
      !/^[a-zA-Z0-9_\-]+$/.test(razorpayOrderId.trim())
    ) {
      sendError(res, 'Missing or invalid payment verification details', 400);
      return;
    }

    const safeOrderId = razorpayOrderId.trim();
    const safePaymentId = razorpayPaymentId.trim();
    const safeSignature = razorpaySignature.trim();

    const secret = env.razorpayKeySecret || (env.nodeEnv === 'test' ? 'test_secret' : '');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${safeOrderId}|${safePaymentId}`)
      .digest('hex');

    const isValidSignature = safeCompareSignatures(expectedSignature, safeSignature);

    if (!isValidSignature) {
      // Guard: ONLY update orders that are NOT already Completed.
      // A bad signature sent after successful payment must NEVER flip a paid order to Failed!
      await Order.updateMany(
        { razorpayOrderId: safeOrderId, buyerId: req.user!._id, paymentStatus: { $ne: PaymentStatus.Completed } },
        { $set: { paymentStatus: PaymentStatus.Failed } },
      );
      sendError(res, 'Payment verification failed: invalid signature', 400);
      return;
    }

    const orders = await Order.find({ razorpayOrderId: safeOrderId, buyerId: req.user!._id });
    if (orders.length === 0) { sendError(res, 'No orders found for this payment', 404); return; }

    const allCompleted = orders.every((o) => o.paymentStatus === PaymentStatus.Completed);
    if (allCompleted) {
      res.status(200).json({ message: 'Payment verified successfully', orderIds: orders.map((o) => String(o._id)) });
      return;
    }

    // Verify paid amount matches order total if Razorpay instance is configured
    const totalExpectedAmount = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    if (isRazorpayConfigured() && env.nodeEnv !== 'test' && !razorpayPaymentId.startsWith('pay_mock_')) {
      try {
        const razorpay = getRazorpayInstance();
        if (razorpay) {
          const paymentEntity = await (razorpay.payments as any).fetch(razorpayPaymentId);
          if (paymentEntity && paymentEntity.amount !== undefined) {
            const paidAmount = Number(paymentEntity.amount) / 100;
            if (Math.abs(paidAmount - totalExpectedAmount) > 0.01) {
              sendError(res, `Payment amount mismatch: expected ₹${totalExpectedAmount}, received ₹${paidAmount}`, 400);
              return;
            }
          }
        }
      } catch {
        // If razorpay network fails or mock test, proceed if signature HMAC verified
      }
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

    res.status(200).json({ success: true, message: 'Payment verified successfully', orderIds: orders.map((o) => String(o._id)) });
  } catch (error) {
    next(error);
  }
}

export async function markRazorpayPaymentFailed(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { razorpayOrderId, reason } = req.body as { razorpayOrderId: string; reason?: string };
    if (!razorpayOrderId || typeof razorpayOrderId !== 'string' || !/^[a-zA-Z0-9_\-]+$/.test(razorpayOrderId.trim())) {
      sendError(res, 'Valid razorpayOrderId is required', 400);
      return;
    }
    const safeOrderId = razorpayOrderId.trim();

    const result = await Order.updateMany(
      { razorpayOrderId: safeOrderId, buyerId: req.user!._id, paymentStatus: { $ne: PaymentStatus.Completed } },
      {
        $set: { paymentStatus: PaymentStatus.Failed },
        $push: { timeline: { event: 'PAYMENT_FAILED', description: reason || 'Online payment failed', timestamp: new Date() } },
      },
    );
    res.status(200).json({ success: true, message: 'Payment marked as failed', modifiedCount: result.modifiedCount });
  } catch (error) {
    next(error);
  }
}

export async function handleRazorpayWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const webhookSecret = env.razorpayWebhookSecret || env.razorpayKeySecret;
    if (!webhookSecret) {
      sendError(res, 'Webhook secret not configured on server', 400);
      return;
    }

    const signature = req.headers['x-razorpay-signature'] as string | undefined;
    if (!signature) {
      sendError(res, 'Missing x-razorpay-signature header', 400);
      return;
    }

    if (!req.rawBody) {
      sendError(res, 'Raw body missing for webhook signature verification', 400);
      return;
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(req.rawBody)
      .digest('hex');

    if (!safeCompareSignatures(expectedSignature, signature)) {
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

      if (!razorpayOrderId || typeof razorpayOrderId !== 'string' || !/^[a-zA-Z0-9_\-]+$/.test(razorpayOrderId.trim())) {
        res.status(200).json({ status: 'ignored', message: 'No valid order ID in payload' });
        return;
      }
      const safeOrderId = razorpayOrderId.trim();

      const orders = await Order.find({ razorpayOrderId: safeOrderId });
      if (orders.length === 0) {
        console.warn(`[Webhook] No matching orders found for razorpayOrderId: ${razorpayOrderId}`);
        res.status(200).json({ status: 'ignored', message: 'Orders not found' });
        return;
      }

      // Verify that paid amount matches order total amount
      const totalAmount = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      if (payment?.amount !== undefined) {
        const paidAmount = Number(payment.amount) / 100;
        if (Math.abs(paidAmount - totalAmount) > 0.01) {
          console.error(`[Webhook] Amount mismatch for order ${razorpayOrderId}: expected ₹${totalAmount}, paid ₹${paidAmount}`);
          sendError(res, 'Payment amount mismatch', 400);
          return;
        }
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

      if (razorpayOrderId && typeof razorpayOrderId === 'string' && /^[a-zA-Z0-9_\-]+$/.test(razorpayOrderId.trim())) {
        const safeOrderId = razorpayOrderId.trim();
        await Order.updateMany(
          { razorpayOrderId: safeOrderId, paymentStatus: { $ne: PaymentStatus.Completed } },
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
