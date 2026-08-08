import { Queue, Worker } from 'bullmq';
import { connection } from './queue.js';
import OutboxEvent from '../models/OutboxEvent.js';
import Notification from '../models/Notification.js';
import { notifyOrderUpdate } from '../socket/eventHandlers.js';
import Order from '../models/Order.js';

export const outboxQueue = connection ? new Queue('outboxQueue', { connection }) : null;

export function startOutboxWorker() {
  if (!connection) return null;
  const outboxWorker = new Worker(
    'outboxQueue',
    async (job) => {
      const { eventId } = job.data;
      const event = await OutboxEvent.findById(eventId);
      if (!event || event.status !== 'PENDING') return;

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

          const order = await Order.findById(orderId).populate('buyerId', 'name email').populate('cropId', 'name images price');
          if (order) notifyOrderUpdate(order, 'order:new');
        }

        event.status = 'PROCESSED';
        await event.save();
      } catch (err) {
        console.error(`OutboxWorker Error processing event ${eventId}:`, err);
        event.retryCount += 1;
        if (event.retryCount >= 3) {
          event.status = 'FAILED';
        }
        await event.save();
        throw err; // Trigger bullmq retry
      }
    },
    { connection }
  );

  outboxWorker.on('failed', (job, err) => {
    console.error(`OutboxWorker job ${job?.id} failed with error:`, err.message);
  });

  return outboxWorker;
}
