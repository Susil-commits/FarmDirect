import mongoose, { type Types } from 'mongoose';
import UserOrderStats from '../models/UserOrderStats.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import PriceSnapshot from '../models/PriceSnapshot.js';
import { mlClient } from '../ai/mlClient.js';
import { PaymentMethod, OrderStatus } from '../types/enums.js';
import logger from '../utils/logger.js';

export interface OrderAnomalyEvaluation {
  orderId: string;
  isAnomaly: boolean;
  anomalyScore: number;
  reasons: string[];
  modelUsed: string;
}

/**
 * Anomaly v2 evaluation for an order (T5.1)
 * Combines market median, velocity, cancellation rates, and Welford fallback.
 */
export async function evaluateOrderAnomaly(orderId: string | Types.ObjectId): Promise<OrderAnomalyEvaluation> {
  const parsedId = typeof orderId === 'string' ? new mongoose.Types.ObjectId(orderId) : orderId;
  const order = await Order.findById(parsedId).lean();

  if (!order) {
    throw new Error(`Order ${orderId} not found for anomaly evaluation`);
  }

  const userId = String(order.buyerId);
  const amount = Number(order.totalAmount || 0);

  // 1. Feature Extraction: Unit Price & Market Median
  const unitPrice = Number(order.unitPrice || (order.quantity > 0 ? amount / order.quantity : 0));
  let marketMedian = unitPrice;

  if (order.cropName) {
    const snapshots = await PriceSnapshot.find({
      cropName: { $regex: new RegExp(`^${order.cropName}$`, 'i') },
      at: { $gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) },
    })
      .select('price')
      .lean();

    if (snapshots.length >= 3) {
      const prices = snapshots.map((s) => Number(s.price)).sort((a, b) => a - b);
      marketMedian = prices[Math.floor(prices.length / 2)];
    }
  }

  // 2. Feature Extraction: Quantity vs Typical
  let typicalQuantity = 25;
  if (order.cropId) {
    const historicalOrders = await Order.find({
      cropId: order.cropId,
      _id: { $ne: parsedId },
    })
      .select('quantity')
      .limit(20)
      .lean();

    if (historicalOrders.length >= 3) {
      const quantities = historicalOrders.map((o) => Number(o.quantity)).sort((a, b) => a - b);
      typicalQuantity = quantities[Math.floor(quantities.length / 2)];
    }
  }

  // 3. Feature Extraction: Buyer Profile & History
  let buyerAgeDays = 30.0;
  const buyerUser = await User.findById(order.buyerId).select('createdAt').lean();
  if (buyerUser && buyerUser.createdAt) {
    buyerAgeDays = Math.max(0.01, (Date.now() - new Date(buyerUser.createdAt).getTime()) / (1000 * 3600 * 24));
  }

  const oneHourAgo = new Date(Date.now() - 3600 * 1000);
  const ordersLastHour = await Order.countDocuments({
    buyerId: order.buyerId,
    createdAt: { $gte: oneHourAgo },
  });

  const totalBuyerOrders = await Order.countDocuments({ buyerId: order.buyerId });
  const cancelledBuyerOrders = await Order.countDocuments({
    buyerId: order.buyerId,
    orderStatus: OrderStatus.Cancelled,
  });
  const buyerCancellationRate = totalBuyerOrders > 0 ? cancelledBuyerOrders / totalBuyerOrders : 0;

  const isCod = order.paymentMethod === PaymentMethod.Cod;
  const discountAmount = Number(order.discountAmount || 0);
  const originalAmount = Number(order.originalAmount || amount);
  const discountPct = originalAmount > 0 ? (discountAmount / originalAmount) * 100 : 0;

  // 4. ML / Rule-based Anomaly Scoring
  const mlResult = await mlClient.scoreAnomaly({
    orderId: String(order._id),
    unitPrice,
    marketMedian,
    quantity: Number(order.quantity || 1),
    typicalQuantity,
    buyerAgeDays,
    ordersLastHour,
    isCod,
    buyerCancellationRate,
    discountPct,
  });

  const reasons = [...mlResult.reasons];
  let combinedScore = mlResult.anomalyScore;
  let isAnomaly = mlResult.isAnomaly;

  // 5. Welford Running Mean/Variance Check (Fallback / Safeguard)
  let stats = await UserOrderStats.findById(userId);
  if (!stats || stats.n < 4) {
    const globalStats = await UserOrderStats.findById('global');
    if (globalStats && globalStats.n >= 4) {
      stats = globalStats;
    }
  }

  let zScore: number | null = null;
  if (stats && stats.n >= 4) {
    const stddev = Math.sqrt(stats.m2 / (stats.n - 1));
    if (stddev === 0) {
      zScore = amount !== stats.mean ? 10 : 0;
    } else {
      zScore = (amount - stats.mean) / stddev;
    }

    if (Math.abs(zScore) > 3.0) {
      isAnomaly = true;
      combinedScore = Math.max(combinedScore, Math.min(1.0, 0.40 + Math.abs(zScore) * 0.10));
      reasons.push(`Total order value ₹${amount} deviates significantly from typical spend (|z| = ${zScore.toFixed(1)} > 3.0)`);
    }
  }

  // Update order with computed anomaly diagnostics
  const isFlagged = isAnomaly || (zScore !== null && Math.abs(zScore) > 3.0);
  let finalScore: number | null = null;
  if (isFlagged) {
    if (zScore !== null && Math.abs(zScore) > 3.0) {
      finalScore = Number(zScore.toFixed(2));
    } else {
      finalScore = Number(combinedScore.toFixed(2));
    }
  }
  const finalReasons = isFlagged ? Array.from(new Set(reasons)) : [];
  const modelUsed = mlClient.isConfigured() ? 'ml-service-v2' : 'robust-z-rules-v2';

  await Order.findByIdAndUpdate(parsedId, {
    flaggedAsAnomaly: isFlagged,
    anomalyScore: finalScore,
    anomalyReasons: finalReasons,
    anomalyModelUsed: modelUsed,
  });

  // Update running statistics
  await updateWelfordStats(userId, amount);
  await updateWelfordStats('global', amount);

  return {
    orderId: String(parsedId),
    isAnomaly: isFlagged,
    anomalyScore: combinedScore,
    reasons: finalReasons,
    modelUsed,
  };
}

/**
 * Asynchronous job / queue entrypoint (preserves existing signature for workers)
 */
export async function flagAnomalyAsync(orderId: string, amount: number, userId: string): Promise<void> {
  try {
    await evaluateOrderAnomaly(orderId);
  } catch (error: any) {
    logger.warn({ err: error?.message || error, orderId, userId, amount }, 'Failed to evaluate order anomaly');
    // Fallback directly to Welford stats update so running baseline remains consistent
    try {
      await updateWelfordStats(userId, amount);
      await updateWelfordStats('global', amount);
    } catch {}
  }
}

async function updateWelfordStats(id: string, amount: number) {
  await UserOrderStats.findOneAndUpdate(
    { _id: id },
    [
      {
        $set: {
          n: { $add: [{ $ifNull: ['$n', 0] }, 1] },
          delta: { $subtract: [amount, { $ifNull: ['$mean', 0] }] },
        },
      },
      {
        $set: {
          mean: { $add: [{ $ifNull: ['$mean', 0] }, { $divide: ['$delta', '$n'] }] },
        },
      },
      {
        $set: {
          delta2: { $subtract: [amount, '$mean'] },
        },
      },
      {
        $set: {
          m2: { $add: [{ $ifNull: ['$m2', 0] }, { $multiply: ['$delta', '$delta2'] }] },
          updatedAt: new Date(),
        },
      },
      {
        $unset: ['delta', 'delta2'],
      },
    ],
    { upsert: true }
  );
}
