import Order from '../models/Order.js';
import Notification from '../models/Notification.js';
import { getRazorpayInstance, isRazorpayConfigured } from '../config/razorpay.js';
import { notifyOrderUpdate } from '../socket/eventHandlers.js';
import { PaymentMethod, PaymentStatus } from '../types/enums.js';

let intervalHandle: NodeJS.Timeout | null = null;

export async function reconcilePendingRazorpayPayments(): Promise<void> {
  if (!isRazorpayConfigured()) return;
  const razorpay = getRazorpayInstance();
  if (!razorpay) return;

  try {
    const cutoffRecent = new Date(Date.now() - 15 * 60 * 1000); // at least 15 min old
    const cutoffOldest = new Date(Date.now() - 24 * 60 * 60 * 1000); // within last 24h

    const pendingOrders = await Order.find({
      paymentMethod: PaymentMethod.Razorpay,
      paymentStatus: PaymentStatus.Pending,
      razorpayOrderId: { $exists: true, $ne: null },
      createdAt: { $gte: cutoffOldest, $lte: cutoffRecent },
    }).limit(50);

    if (pendingOrders.length === 0) return;

    for (const order of pendingOrders) {
      try {
        if (!order.razorpayOrderId) continue;

        // Fetch payments for this Razorpay order
        const paymentsResponse = await razorpay.orders.fetchPayments(order.razorpayOrderId) as any;
        const items = paymentsResponse?.items || [];

        const capturedPayment = items.find((p: any) => p.status === 'captured');

        if (capturedPayment) {
          // Atomically update order to Completed
          const updated = await Order.findOneAndUpdate(
            { _id: order._id, paymentStatus: { $ne: PaymentStatus.Completed } },
            {
              $set: {
                paymentStatus: PaymentStatus.Completed,
                razorpayPaymentId: capturedPayment.id,
              },
              $push: {
                timeline: {
                  event: 'PAYMENT_COMPLETED',
                  description: 'Payment reconciled via background Razorpay sync',
                  timestamp: new Date(),
                },
              },
            },
            { new: true }
          );

          if (updated) {
            try {
              await Notification.create({
                userId: updated.farmerId,
                title: 'Payment Reconciled',
                message: `Payment of ₹${updated.totalAmount} reconciled for order #${updated.orderNumber} (${updated.cropName}).`,
                type: 'order',
                relatedId: String(updated._id),
                priority: 'high',
                actionUrl: `/farmer/orders/${updated._id}`,
                data: { orderId: updated._id, orderNumber: updated.orderNumber, paymentMethod: 'razorpay' },
              });
              notifyOrderUpdate(updated, 'order:statusUpdated');
            } catch (nErr) {
              console.error('[ReconciliationWorker] Notification error:', nErr);
            }
          }
        } else if (order.createdAt < new Date(Date.now() - 6 * 60 * 60 * 1000)) {
          // If older than 6 hours and no successful payment, mark as expired/failed
          await Order.findOneAndUpdate(
            { _id: order._id, paymentStatus: PaymentStatus.Pending },
            {
              $set: { paymentStatus: PaymentStatus.Failed },
              $push: {
                timeline: {
                  event: 'PAYMENT_EXPIRED',
                  description: 'Payment window expired without completion',
                  timestamp: new Date(),
                },
              },
            }
          );
        }
      } catch (err: any) {
        console.warn(`[ReconciliationWorker] Failed to reconcile order ${order._id}:`, err?.message || err);
      }
    }
  } catch (error: any) {
    console.error('[ReconciliationWorker] Error during payment reconciliation run:', error?.message || error);
  }
}

export function startPaymentReconciliationWorker(intervalMs = 15 * 60 * 1000): void {
  if (intervalHandle) return;
  // Run initial reconciliation shortly after startup (after 30s)
  setTimeout(() => {
    reconcilePendingRazorpayPayments().catch(() => {});
  }, 30000);

  intervalHandle = setInterval(() => {
    reconcilePendingRazorpayPayments().catch(() => {});
  }, intervalMs);

  console.log('[ReconciliationWorker] Razorpay payment reconciliation worker scheduled (every 15m)');
}

export function stopPaymentReconciliationWorker(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}
