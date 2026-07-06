import crypto from 'crypto';
import Order from '../models/Order.js';
import Notification from '../models/Notification.js';
import { getRazorpayInstance, isRazorpayConfigured } from '../config/razorpay.js';
import { notifyOrderUpdate } from '../socket/eventHandlers.js';

const VALID_PAYMENT_METHODS = ['cod', 'razorpay'];

// @route  POST /api/payments/razorpay/init
// @desc   Create a Razorpay order for one or more existing buyer orders (online payment)
// @access Private (buyer)
export const createRazorpayOrder = async (req, res, next) => {
  try {
    if (!isRazorpayConfigured()) {
      return res.status(500).json({ message: 'Razorpay is not configured on the server' });
    }

    const razorpay = getRazorpayInstance();
    const { orderId, orderIds } = req.body;

    // Normalize into an array of order ids
    let ids = [];
    if (Array.isArray(orderIds) && orderIds.length > 0) {
      ids = orderIds;
    } else if (orderId) {
      ids = [orderId];
    } else {
      return res.status(400).json({ message: 'orderId or orderIds is required' });
    }

    // Fetch the orders and validate buyer ownership
    const orders = await Order.find({ _id: { $in: ids }, buyerId: req.user._id });
    if (orders.length === 0) {
      return res.status(404).json({ message: 'No matching orders found for this buyer' });
    }

    // Already fully paid? Nothing to charge.
    const unpaidOrders = orders.filter((o) => o.paymentStatus !== 'completed');
    if (unpaidOrders.length === 0) {
      return res.status(400).json({ message: 'All selected orders are already paid' });
    }

    // Server is source of truth for the payable amount (sum of order totals, in INR)
    const totalAmount = unpaidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    if (totalAmount <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    const targetIds = unpaidOrders.map((o) => o._id);
    const receipt = `rcpt_${String(targetIds[0]).slice(-12)}`;

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100), // amount in paise
      currency: 'INR',
      receipt,
      notes: {
        orderIds: targetIds.map((id) => String(id)).join(','),
        buyerId: String(req.user._id),
      },
    });

    // Persist the Razorpay order id on each order so verify() can locate them
    await Order.updateMany(
      { _id: { $in: targetIds } },
      {
        $set: {
          razorpayOrderId: razorpayOrder.id,
          paymentMethod: 'razorpay',
        },
      }
    );

    res.status(200).json({
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount, // paise
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      orderIds: targetIds.map((id) => String(id)),
    });
  } catch (error) {
    next(error);
  }
};

// @route  POST /api/payments/razorpay/verify
// @desc   Verify Razorpay payment signature and mark linked orders as paid
// @access Private (buyer)
export const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ message: 'Missing payment verification details' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      // Mark linked orders as failed so the buyer can retry
      await Order.updateMany(
        { razorpayOrderId, buyerId: req.user._id },
        { $set: { paymentStatus: 'failed' } }
      );
      return res.status(400).json({ message: 'Payment verification failed: invalid signature' });
    }

    const orders = await Order.find({ razorpayOrderId, buyerId: req.user._id });
    if (orders.length === 0) {
      return res.status(404).json({ message: 'No orders found for this payment' });
    }

    await Order.updateMany(
      { _id: { $in: orders.map((o) => o._id) } },
      {
        $set: {
          paymentStatus: 'completed',
          razorpayPaymentId,
          razorpaySignature,
        },
        $push: {
          timeline: {
            event: 'PAYMENT_COMPLETED',
            description: 'Online payment verified via Razorpay',
            timestamp: new Date(),
          },
        },
      }
    );

    // Notify each farmer that payment was received (best-effort)
    for (const order of orders) {
      try {
        await Notification.create({
          userId: order.farmerId,
          title: 'Payment Received 💳',
          message: `Payment of ₹${order.totalAmount} received for order #${order.orderNumber} (${order.cropName}).`,
          type: 'order',
          relatedId: order._id,
          priority: 'high',
          actionUrl: `/farmer/orders/${order._id}`,
          data: {
            orderId: order._id,
            orderNumber: order.orderNumber,
            paymentMethod: 'razorpay',
          },
        });
        notifyOrderUpdate(order, 'order:statusUpdated');
      } catch (notifErr) {
        console.error('Failed to create payment notification:', notifErr);
      }
    }

    res.status(200).json({
      message: 'Payment verified successfully',
      orderIds: orders.map((o) => String(o._id)),
    });
  } catch (error) {
    next(error);
  }
};

// @route  POST /api/payments/razorpay/failed
// @desc   Mark a payment attempt as failed (called when Razorpay reports a failure)
// @access Private (buyer)
export const markRazorpayPaymentFailed = async (req, res, next) => {
  try {
    const { razorpayOrderId, reason } = req.body;
    if (!razorpayOrderId) {
      return res.status(400).json({ message: 'razorpayOrderId is required' });
    }

    const result = await Order.updateMany(
      { razorpayOrderId, buyerId: req.user._id, paymentStatus: { $ne: 'completed' } },
      {
        $set: { paymentStatus: 'failed' },
        $push: {
          timeline: {
            event: 'PAYMENT_FAILED',
            description: reason || 'Online payment failed',
            timestamp: new Date(),
          },
        },
      }
    );

    res.status(200).json({ message: 'Payment marked as failed', modifiedCount: result.modifiedCount });
  } catch (error) {
    next(error);
  }
};

export { VALID_PAYMENT_METHODS };
