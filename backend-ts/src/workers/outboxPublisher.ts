import OutboxEvent from '../models/OutboxEvent.js';
import { outboxQueue, triggerImmediateOutboxSweep } from './outboxWorker.js';

export { triggerImmediateOutboxSweep };

export async function createOutboxEvent(eventType: string, payload: any, session?: any) {
  const event = new OutboxEvent({
    eventType,
    payload,
  });
  
  if (session) {
    await event.save({ session });
  } else {
    await event.save();
  }

  if (outboxQueue) {
    await outboxQueue.add('processOutboxEvent', { eventId: event._id }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
  } else {
    console.warn('[OutboxPublisher] OutboxQueue is not initialized. Event stored in MongoDB; fallback polling sweeper will process it.');
    // If not inside a session, trigger an immediate sweep
    if (!session) {
      triggerImmediateOutboxSweep();
    }
  }
}
