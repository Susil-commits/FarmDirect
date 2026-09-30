import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import EventLog from '../models/EventLog.js';

describe('POST /api/events - Event Logging API', () => {
  it('should accept a batch of valid events and persist them with TTL and no PII', async () => {
    const validCropId = new mongoose.Types.ObjectId().toString();

    const payload = {
      events: [
        {
          sessionId: 'test_session_123',
          type: 'view',
          cropId: validCropId,
          meta: {
            cropName: 'Organic Tomato',
            category: 'vegetables',
            phone: '9876543210', // PII to be stripped
            password: 'secret_password', // PII to be stripped
            browser: 'Chrome', // Allowed
          },
          at: new Date().toISOString(),
        },
        {
          sessionId: 'test_session_123',
          type: 'search',
          query: 'fresh mango',
          meta: { resultsCount: 5 },
          at: new Date().toISOString(),
        },
      ],
    };

    const res = await request(app)
      .post('/api/events')
      .send(payload)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(2);

    const savedEvents = await EventLog.find({ sessionId: 'test_session_123' });
    expect(savedEvents.length).toBe(2);

    const viewEvent = savedEvents.find((e) => e.type === 'view');
    expect(viewEvent).toBeDefined();
    expect(viewEvent?.cropId?.toString()).toBe(validCropId);
    expect(viewEvent?.meta?.browser).toBe('Chrome');
    // Ensure PII fields were stripped
    expect(viewEvent?.meta?.phone).toBeUndefined();
    expect(viewEvent?.meta?.password).toBeUndefined();

    const searchEvent = savedEvents.find((e) => e.type === 'search');
    expect(searchEvent?.query).toBe('fresh mango');
  });

  it('should reject invalid event batch payload with 400', async () => {
    const res = await request(app)
      .post('/api/events')
      .send({ events: [] }) // min(1) violation
      .expect(400);

    expect(res.body.success).toBe(false);
  });
});
