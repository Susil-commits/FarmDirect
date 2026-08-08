import OutboxEvent from '../models/OutboxEvent.js';
import { outboxQueue } from './outboxWorker.js';

export async function createOutboxEvent(eventType: string, payload: any, session?: any) {
  const event = new OutboxEvent({
    eventType,
    payload
  });
  
  if (session) {
    await event.save({ session });
  } else {
    await event.save();
  }

  if (outboxQueue) {
    await outboxQueue.add('processOutboxEvent', { eventId: event._id }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 }
    });
  } else {
    console.warn('OutboxQueue is not initialized. Event stored but not queued.');
  }
}
