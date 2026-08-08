import request from 'supertest';
import app from './testApp.js';
import User from '../models/User.js';
import CropListing from '../models/CropListing.js';
import Order from '../models/Order.js';
import UserOrderStats from '../models/UserOrderStats.js';
import { randomUUID } from 'crypto';

describe('Anomaly Flagging (z-score) in Order Creation', () => {
  let buyerToken: string;
  let buyerId: string;
  let cropId: string;

  beforeEach(async () => {
    const { hashPassword } = await import('../utils/password.js');
    const hashedPassword = await hashPassword('Password123!');

    const farmer = await User.create({
      firstName: 'Test', lastName: 'Farmer', email: 'farmer2@farm.com',
      password: hashedPassword, role: 'farmer', phone: '1234567890', status: 'active', kycStatus: 'verified'
    });

    const buyer = await User.create({
      firstName: 'Test', lastName: 'Buyer', email: 'buyer2@farm.com',
      password: hashedPassword, role: 'buyer', phone: '0987654321', status: 'active', kycStatus: 'verified'
    });
    buyerId = buyer._id.toString();

    const loginRes = await request(app).post('/api/auth/login').send({ email: 'buyer2@farm.com', password: 'Password123!' });
    buyerToken = loginRes.body.token;

    const crop = await CropListing.create({
      farmerId: farmer._id,
      cropName: 'Apples',
      cropType: 'crops',
      category: 'fruits',
      price: 50,
      quantity: 1000,
      unit: 'kg',
      description: 'Fresh apples',
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

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  it('should not flag the first 4 orders (n < 5) and should accumulate stats', async () => {
    for (let i = 0; i < 4; i++) {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .set('Idempotency-Key', randomUUID())
        .send({ cropId, quantity: 2 });
      
      expect(res.status).toBe(201);
    }

    // Wait a bit for background stats update
    await sleep(200);

    const stats = await UserOrderStats.findById(buyerId);
    expect(stats).toBeDefined();
    expect(stats?.n).toBe(4);
    expect(stats?.mean).toBe(100); // 50 * 2 = 100 per order
    
    // Check orders are not flagged
    const orders = await Order.find({ buyerId });
    expect(orders.length).toBe(4);
    orders.forEach(o => {
      expect(o.flaggedAsAnomaly).toBe(false);
      expect(o.anomalyScore).toBeNull();
    });
  });

  it('should flag the 5th order if it has a wildly different amount', async () => {
    // Create 4 normal orders manually
    for (let i = 0; i < 4; i++) {
      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .set('Idempotency-Key', randomUUID())
        .send({ cropId, quantity: 2 }); // 100 amount
    }
    
    await sleep(200);

    // 5th order wildly high amount
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .set('Idempotency-Key', randomUUID())
      .send({ cropId, quantity: 50 }); // 2500 amount
    
    expect(res.status).toBe(201);

    await sleep(200);

    const orderId = res.body.order._id;
    const order = await Order.findById(orderId);
    expect(order?.flaggedAsAnomaly).toBe(true);
    expect(order?.anomalyScore).toBeGreaterThan(3);
  });

  it('should flag a new user first order via global fallback if massive', async () => {
    // Populate global stats with 5 small orders first
    await UserOrderStats.create({
       _id: 'global',
       n: 5,
       mean: 100,
       m2: 50, // Some variance
       updatedAt: new Date()
    });

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .set('Idempotency-Key', randomUUID())
      .send({ cropId, quantity: 100 }); // 5000 amount
    
    expect(res.status).toBe(201);
    await sleep(200);

    const order = await Order.findById(res.body.order._id);
    expect(order?.flaggedAsAnomaly).toBe(true);
    expect(order?.anomalyScore).toBeGreaterThan(3);
  });

  it('GET /api/admin/orders/flagged should return only flagged orders, correctly sorted', async () => {
    // Since we need admin endpoint, let's login as admin
    const { hashPassword } = await import('../utils/password.js');
    const hashedPassword = await hashPassword('Password123!');
    await User.create({
      firstName: 'Admin', lastName: 'User', email: 'admin@farm.com',
      password: hashedPassword, role: 'admin', phone: '1231231234', status: 'active', kycStatus: 'verified'
    });
    
    const loginRes = await request(app).post('/api/auth/login').send({ email: 'admin@farm.com', password: 'Password123!' });
    const adminToken = loginRes.body.token;

    // Populate some orders
    await Order.create([
      {
        orderNumber: 'ORD-1', buyerId, farmerId: buyerId, cropId, quantity: 1, unitPrice: 50, totalAmount: 50, orderStatus: 'confirmed', paymentMethod: 'cod', paymentStatus: 'pending',
        flaggedAsAnomaly: false, anomalyScore: null
      },
      {
        orderNumber: 'ORD-2', buyerId, farmerId: buyerId, cropId, quantity: 1, unitPrice: 50, totalAmount: 50, orderStatus: 'confirmed', paymentMethod: 'cod', paymentStatus: 'pending',
        flaggedAsAnomaly: true, anomalyScore: 4.5
      },
      {
        orderNumber: 'ORD-3', buyerId, farmerId: buyerId, cropId, quantity: 1, unitPrice: 50, totalAmount: 50, orderStatus: 'confirmed', paymentMethod: 'cod', paymentStatus: 'pending',
        flaggedAsAnomaly: true, anomalyScore: 6.2
      }
    ]);

    const res = await request(app)
      .get('/api/admin/orders/flagged')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data[0].anomalyScore).toBe(6.2); // Sorted descending
    expect(res.body.data[1].anomalyScore).toBe(4.5);
  });

  it('should handle 10 concurrent orders for the same user without losing Welford updates', async () => {
    // We bypass the createOrder idempotency key by using a different idempotency key for each request
    // This allows 10 actual orders to go through in parallel, triggering the anomaly detection 10 times.
    const promises = Array.from({ length: 10 }).map(() =>
      request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .set('Idempotency-Key', randomUUID())
        .send({ cropId, quantity: 1 })
    );

    const responses = await Promise.all(promises);
    const successes = responses.filter(r => r.status === 201).length;
    
    // Some might fail due to stock depletion if we run out, but crop has 1000 quantity, so 10 should succeed.
    expect(successes).toBe(10);

    await sleep(500); // give the non-blocking background task time to run 10 times

    const stats = await UserOrderStats.findById(buyerId);
    expect(stats).toBeDefined();
    // Since buyerId starts fresh for this test (beforeEach), n should be exactly 10
    expect(stats?.n).toBe(10);
    expect(stats?.mean).toBe(50); // 50 * 1 = 50
  });
});
