import mongoose from 'mongoose';
import OutboxEvent from '../models/OutboxEvent.js';
import Notification from '../models/Notification.js';
import {
  processOutboxEvent,
  sweepPendingOutboxEvents,
  startOutboxPollingWorker,
  stopOutboxPollingWorker,
} from '../workers/outboxWorker.js';

describe('Outbox Fallback Processor', () => {
  afterEach(() => {
    stopOutboxPollingWorker();
  });

  it('should process a single PENDING ORDER_CREATED outbox event and create notification', async () => {
    const farmerId = new mongoose.Types.ObjectId();
    const orderId = new mongoose.Types.ObjectId();

    const event = await OutboxEvent.create({
      eventType: 'ORDER_CREATED',
      payload: {
        orderId,
        farmerId,
        buyerName: 'Ramesh',
        totalAmount: 1500,
        cropName: 'Organic Wheat',
        orderNumber: 'ORD-12345',
      },
      status: 'PENDING',
    });

    const processed = await processOutboxEvent(event._id);
    expect(processed).toBe(true);

    const updatedEvent = await OutboxEvent.findById(event._id);
    expect(updatedEvent?.status).toBe('PROCESSED');

    const notification = await Notification.findOne({ userId: farmerId });
    expect(notification).not.toBeNull();
    expect(notification?.title).toBe('New Order Received');
    expect(notification?.message).toContain('Ramesh');
    expect(notification?.message).toContain('1500');
    expect(notification?.relatedId).toBe(orderId.toString());
  });

  it('should return false and not duplicate when processing already processed event', async () => {
    const farmerId = new mongoose.Types.ObjectId();
    const orderId = new mongoose.Types.ObjectId();

    const event = await OutboxEvent.create({
      eventType: 'ORDER_CREATED',
      payload: {
        orderId,
        farmerId,
        buyerName: 'Suresh',
        totalAmount: 800,
        cropName: 'Tomatoes',
        orderNumber: 'ORD-99999',
      },
      status: 'PROCESSED',
    });

    const result = await processOutboxEvent(event._id);
    expect(result).toBe(false);

    const notifCount = await Notification.countDocuments({ userId: farmerId });
    expect(notifCount).toBe(0);
  });

  it('should sweep multiple PENDING events via sweepPendingOutboxEvents', async () => {
    const farmer1 = new mongoose.Types.ObjectId();
    const farmer2 = new mongoose.Types.ObjectId();

    await OutboxEvent.create([
      {
        eventType: 'ORDER_CREATED',
        payload: {
          orderId: new mongoose.Types.ObjectId(),
          farmerId: farmer1,
          buyerName: 'Buyer 1',
          totalAmount: 500,
          cropName: 'Rice',
          orderNumber: 'ORD-001',
        },
        status: 'PENDING',
      },
      {
        eventType: 'ORDER_CREATED',
        payload: {
          orderId: new mongoose.Types.ObjectId(),
          farmerId: farmer2,
          buyerName: 'Buyer 2',
          totalAmount: 1200,
          cropName: 'Corn',
          orderNumber: 'ORD-002',
        },
        status: 'PENDING',
      },
    ]);

    await sweepPendingOutboxEvents();

    const pendingCount = await OutboxEvent.countDocuments({ status: 'PENDING' });
    expect(pendingCount).toBe(0);

    const processedCount = await OutboxEvent.countDocuments({ status: 'PROCESSED' });
    expect(processedCount).toBe(2);

    const notifs = await Notification.find({ userId: { $in: [farmer1, farmer2] } });
    expect(notifs.length).toBe(2);
  });

  it('should cleanly start and stop the fallback polling worker', () => {
    expect(() => {
      startOutboxPollingWorker(5000);
      stopOutboxPollingWorker();
    }).not.toThrow();
  });
});
