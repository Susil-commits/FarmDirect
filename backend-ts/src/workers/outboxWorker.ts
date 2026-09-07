import { Queue, Worker } from 'bullmq';
import mongoose, { type Types } from 'mongoose';
import { connection } from './queue.js';
import OutboxEvent from '../models/OutboxEvent.js';
import Notification from '../models/Notification.js';
import { notifyOrderUpdate } from '../socket/eventHandlers.js';
import Order from '../models/Order.js';

export const outboxQueue = connection ? new Queue('outboxQueue', { connection }) : null;
if (outboxQueue) {
  outboxQueue.on('error', () => {});
}

let pollingIntervalHandle: NodeJS.Timeout | null = null;

/**
 * Process a single outbox event by ID with atomic claim semantics.
 * Can be called by the BullMQ worker or by the fallback polling sweeper.
 */
export async function processOutboxEvent(eventId: string | Types.ObjectId): Promise<boolean> {
  const event = await OutboxEvent.findOneAndUpdate(
    { _id: eventId, status: 'PENDING' },
    { $set: { status: 'PROCESSING' } },
    { new: true }
  );

  if (!event) {
    return false;
  }

  try {
    if (event.eventType === 'ORDER_CREATED') {
      const { orderId, farmerId, buyerName, totalAmount, cropName, orderNumber } = event.payload;

      await Notification.create({
        userId: farmerId,
        title: 'New Order Received',
        message: `${buyerName} placed an order for ₹${totalAmount} (${cropName}).`,
        type: 'order',
        relatedId: orderId,
        actionUrl: `/farmer/orders/${orderId}`,
        priority: 'high',
        data: { orderId, orderNumber },
      });

      const order = await Order.findById(orderId)
        .populate('buyerId', 'name email')
        .populate('cropId', 'name images price');

      if (order) notifyOrderUpdate(order, 'order:new');
    }

    event.status = 'PROCESSED';
    await event.save();
    return true;
  } catch (err: any) {
    console.error(`[OutboxWorker] Error processing event ${eventId}:`, err);
    event.retryCount = (event.retryCount || 0) + 1;
    if (event.retryCount >= 3) {
      event.status = 'FAILED';
    } else {
      event.status = 'PENDING';
    }
    await event.save();
    throw err;
  }
}

/**
 * Sweeps pending outbox events from MongoDB.
 * If Redis/BullMQ is active, it only sweeps events older than 10s (acting as safety fallback).
 * If Redis is not active, it sweeps pending events immediately.
 * Also recovers events stuck in PROCESSING for more than 2 minutes.
 */
export async function sweepPendingOutboxEvents(): Promise<void> {
  if (mongoose.connection.readyState !== 1) return;
  try {
    // Recover stale PROCESSING events
    const staleProcessingCutoff = new Date(Date.now() - 2 * 60 * 1000);
    await OutboxEvent.updateMany(
      { status: 'PROCESSING', updatedAt: { $lte: staleProcessingCutoff } },
      { $set: { status: 'PENDING' } }
    );

    const thresholdMs = (connection && process.env.NODE_ENV !== 'test') ? 10 * 1000 : 0;
    const cutoff = new Date(Date.now() - thresholdMs);

    const pendingEvents = await OutboxEvent.find({
      status: 'PENDING',
      createdAt: { $lte: cutoff },
    })
      .sort({ createdAt: 1 })
      .limit(50);

    if (pendingEvents.length === 0) return;

    for (const event of pendingEvents) {
      try {
        await processOutboxEvent(event._id);
      } catch {
        // Logged inside processOutboxEvent; proceed with remaining batch
      }
    }
  } catch (error: any) {
    console.error('[OutboxWorker] Error during outbox sweep:', error?.message || error);
  }
}

/**
 * Triggers an immediate sweep if Redis queue is uninitialized.
 * Non-blocking via setImmediate.
 */
export function triggerImmediateOutboxSweep(): void {
  if (!outboxQueue) {
    setImmediate(() => {
      sweepPendingOutboxEvents().catch((err) => {
        console.error('[OutboxWorker] Immediate sweep error:', err);
      });
    });
  }
}

/**
 * Starts the BullMQ worker if Redis connection exists.
 */
export function startOutboxWorker(): Worker | null {
  if (!connection) return null;
  const outboxWorker = new Worker(
    'outboxQueue',
    async (job) => {
      const { eventId } = job.data;
      await processOutboxEvent(eventId);
    },
    { connection }
  );

  outboxWorker.on('failed', (job, err) => {
    console.error(`OutboxWorker job ${job?.id} failed with error:`, err.message);
  });

  return outboxWorker;
}

let startupTimeoutHandle: NodeJS.Timeout | null = null;

/**
 * Starts the fallback polling sweeper (runs on setInterval).
 */
export function startOutboxPollingWorker(intervalMs = 10 * 1000): void {
  if (pollingIntervalHandle) return;

  startupTimeoutHandle = setTimeout(() => {
    startupTimeoutHandle = null;
    sweepPendingOutboxEvents().catch(() => {});
  }, 3000);

  pollingIntervalHandle = setInterval(() => {
    sweepPendingOutboxEvents().catch(() => {});
  }, intervalMs);

  console.log(`[OutboxWorker] Outbox fallback polling worker scheduled (every ${intervalMs / 1000}s)`);
}

/**
 * Stops the fallback polling sweeper.
 */
export function stopOutboxPollingWorker(): void {
  if (startupTimeoutHandle) {
    clearTimeout(startupTimeoutHandle);
    startupTimeoutHandle = null;
  }
  if (pollingIntervalHandle) {
    clearInterval(pollingIntervalHandle);
    pollingIntervalHandle = null;
  }
}
