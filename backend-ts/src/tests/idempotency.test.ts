import request from 'supertest';
import app from './testApp.js';
import User from '../models/User.js';
import CropListing from '../models/CropListing.js';
import Order from '../models/Order.js';
import IdempotencyKey from '../models/IdempotencyKey.js';
import { randomUUID } from 'crypto';

describe('Idempotency Keys in Order Creation', () => {
  let buyerToken: string;
  let farmerId: string;
  let buyerId: string;
  let cropId: string;

  beforeEach(async () => {
    // 1. Create a farmer and a buyer
    const { hashPassword } = await import('../utils/password.js');
    const hashedPassword = await hashPassword('Password123!');

    const farmer = await User.create({
      firstName: 'Test', lastName: 'Farmer', email: 'farmer@farm.com',
      password: hashedPassword, role: 'farmer', phone: '1234567890', status: 'active', kycStatus: 'verified'
    });
    farmerId = farmer._id.toString();

    const buyer = await User.create({
      firstName: 'Test', lastName: 'Buyer', email: 'buyer@farm.com',
      password: hashedPassword, role: 'buyer', phone: '0987654321', status: 'active', kycStatus: 'verified'
    });
    buyerId = buyer._id.toString();

    // 2. Login buyer to get token
    const loginRes = await request(app).post('/api/auth/login').send({ email: 'buyer@farm.com', password: 'Password123!' });
    buyerToken = loginRes.body.token;

    // 3. Create a crop
    const crop = await CropListing.create({
      farmerId: farmer._id,
      cropName: 'Tomatoes',
      cropType: 'vegetables',
      category: 'vegetables',
      price: 50,
      quantity: 100,
      unit: 'kg',
      description: 'Fresh tomatoes',
      images: [],
      pickupLocation: 'Farm',
      contactNumber: '1234567890',
      status: 'active',
      availability: 'available',
      listingApprovalStatus: 'approved',
      interestedBuyers: [{ buyerId: buyer._id, status: 'interested', interestedAt: new Date() }]
    });
    cropId = crop._id.toString();
  });

  it('should reject if Idempotency-Key header is missing', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ cropId, quantity: 2 });
    
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Idempotency-Key header required');
  });

  it('should process a single request with a fresh key', async () => {
    const key = randomUUID();
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .set('Idempotency-Key', key)
      .send({ cropId, quantity: 2 });

    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/successfully/i);

    const doc = await IdempotencyKey.findOne({ key });
    expect(doc).toBeDefined();
    expect(doc?.status).toBe('completed');
  });

  it('should replay the exact same response for a completed request', async () => {
    const key = randomUUID();
    const payload = { cropId, quantity: 2 };

    const res1 = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .set('Idempotency-Key', key)
      .send(payload);
    expect(res1.status).toBe(201);

    const res2 = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .set('Idempotency-Key', key)
      .send(payload);

    expect(res2.status).toBe(201);
    expect(res2.headers['x-idempotent-replay']).toBe('true');
    expect(res2.body.order._id).toBe(res1.body.order._id);
    
    const ordersCount = await Order.countDocuments();
    expect(ordersCount).toBe(1);
  });

  it('should return 422 if the same key is used with a different body', async () => {
    const key = randomUUID();
    await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .set('Idempotency-Key', key)
      .send({ cropId, quantity: 2 });

    const res2 = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .set('Idempotency-Key', key)
      .send({ cropId, quantity: 3 });

    expect(res2.status).toBe(422);
    expect(res2.body.message).toBe('Idempotency-Key reused with different request body');
  });

  it('should handle 10 concurrent requests creating only 1 order', async () => {
    const key = randomUUID();
    const payload = { cropId, quantity: 2 };

    const promises = Array.from({ length: 10 }).map(() =>
      request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .set('Idempotency-Key', key)
        .send(payload)
    );

    const responses = await Promise.all(promises);

    const statuses = responses.map(r => r.status);
    const successes = statuses.filter(s => s === 201).length;
    const conflicts = statuses.filter(s => s === 409).length;

    // 1 should succeed, the rest should be 409 (conflict because pending) or 201 (replay if the first finished very fast)
    expect(successes + conflicts).toBe(10);
    expect(successes).toBeGreaterThanOrEqual(1);

    const ordersCount = await Order.countDocuments();
    expect(ordersCount).toBe(1);
  });

  it('should overtake a stale pending doc', async () => {
    const key = randomUUID();
    
    const payload = { cropId, quantity: 2 };
    const { createHash } = await import('crypto');
    const hash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');

    // Create a stale pending doc (60 seconds ago)
    await IdempotencyKey.create({
      key,
      status: 'pending',
      requestHash: hash,
      createdAt: new Date(Date.now() - 60000),
      expiresAt: new Date(Date.now() + 86400000)
    });

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .set('Idempotency-Key', key)
      .send({ cropId, quantity: 2 });

    // Since it's stale, it will overtake and process
    expect(res.status).toBe(201);
  });
});
