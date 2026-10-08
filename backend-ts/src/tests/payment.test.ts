import request from 'supertest';
import crypto from 'node:crypto';
import app from '../app.js';
import User from '../models/User.js';
import CropListing from '../models/CropListing.js';
import Order from '../models/Order.js';
import { generateToken } from '../utils/jwt.js';
import { env } from '../config/env.js';
import { OrderStatus, PaymentMethod, PaymentStatus, CropCategory, CropType, CropUnit, CropAvailability, ListingApprovalStatus } from '../types/enums.js';

describe('Payment Flow Security & Integrity Tests', () => {
  let buyer: any;
  let farmer: any;
  let buyerToken: string;
  let crop: any;

  beforeEach(async () => {
    await User.deleteMany({});
    await CropListing.deleteMany({});
    await Order.deleteMany({});

    buyer = await User.create({
      firstName: 'Test',
      lastName: 'Buyer',
      email: 'buyer.pay@example.com',
      password: 'Password123!',
      role: 'buyer',
      isEmailVerified: true,
      kycStatus: 'verified',
    });
    buyerToken = generateToken(buyer._id, buyer.role);

    farmer = await User.create({
      firstName: 'Test',
      lastName: 'Farmer',
      email: 'farmer.pay@example.com',
      password: 'Password123!',
      role: 'farmer',
      isEmailVerified: true,
      kycStatus: 'verified',
    });

    crop = await CropListing.create({
      farmerId: farmer._id,
      cropName: 'Organic Wheat',
      description: 'Fresh farm harvest wheat',
      contactNumber: '9876543210',
      category: CropCategory.Grains,
      type: CropType.Crops,
      quantity: 100,
      price: 50,
      unit: CropUnit.Kg,
      availability: CropAvailability.Available,
      listingApprovalStatus: ListingApprovalStatus.Approved,
      pickupLocation: 'Bhubaneswar',
    });
  });

  describe('T1: Guard against bad signature flipping Completed orders', () => {
    it('should NOT flip a paid/Completed order to Failed when a bad signature is POSTed', async () => {
      // 1. Create an order that is already Completed
      const order = await Order.create({
        orderNumber: 'ORD-TEST-PAID-001',
        buyerId: buyer._id,
        farmerId: farmer._id,
        cropId: crop._id,
        cropName: crop.cropName,
        quantity: 2,
        unitPrice: 50,
        totalAmount: 100,
        paymentMethod: PaymentMethod.Razorpay,
        paymentStatus: PaymentStatus.Completed,
        orderStatus: OrderStatus.Confirmed,
        razorpayOrderId: 'order_rzp_paid_123',
      });

      // 2. Buyer attempts to send a garbage signature
      const res = await request(app)
        .post('/api/payments/razorpay/verify')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          razorpayOrderId: 'order_rzp_paid_123',
          razorpayPaymentId: 'pay_rzp_spoofed_456',
          razorpaySignature: 'invalid_garbage_signature_hash',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);

      // 3. Verify in database that the order paymentStatus is STILL Completed
      const dbOrder = await Order.findById(order._id);
      expect(dbOrder).not.toBeNull();
      expect(dbOrder!.paymentStatus).toBe(PaymentStatus.Completed);
    });
  });

  describe('T2: Double Init Idempotency', () => {
    it('should return existing razorpayOrderId on second init call rather than overwriting it', async () => {
      // Order created with pending payment
      const order = await Order.create({
        orderNumber: 'ORD-TEST-INIT-001',
        buyerId: buyer._id,
        farmerId: farmer._id,
        cropId: crop._id,
        cropName: crop.cropName,
        quantity: 2,
        unitPrice: 50,
        totalAmount: 100,
        paymentMethod: PaymentMethod.Razorpay,
        paymentStatus: PaymentStatus.Pending,
        orderStatus: OrderStatus.Confirmed,
        razorpayOrderId: 'order_mock_existing_999',
      });

      // Call razorpay init
      const res = await request(app)
        .post('/api/payments/razorpay/init')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ orderId: order._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // It must return the active existing razorpay order ID rather than creating a new one and orphaning the first
      expect(res.body.razorpayOrderId).toBe('order_mock_existing_999');

      const dbOrder = await Order.findById(order._id);
      expect(dbOrder!.razorpayOrderId).toBe('order_mock_existing_999');
    });
  });

  describe('T3: Valid Signature Verification and Amount Guard', () => {
    it('should successfully verify payment with a valid HMAC-SHA256 signature', async () => {
      const order = await Order.create({
        orderNumber: 'ORD-TEST-VALID-001',
        buyerId: buyer._id,
        farmerId: farmer._id,
        cropId: crop._id,
        cropName: crop.cropName,
        quantity: 1,
        unitPrice: 50,
        totalAmount: 50,
        paymentMethod: PaymentMethod.Razorpay,
        paymentStatus: PaymentStatus.Pending,
        orderStatus: OrderStatus.Confirmed,
        razorpayOrderId: 'order_mock_rzp_valid',
      });

      const paymentId = 'pay_mock_12345';
      const secret = env.razorpayKeySecret || 'test_secret';
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${order.razorpayOrderId}|${paymentId}`)
        .digest('hex');

      const res = await request(app)
        .post('/api/payments/razorpay/verify')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          razorpayOrderId: order.razorpayOrderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: expectedSignature,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const dbOrder = await Order.findById(order._id);
      expect(dbOrder!.paymentStatus).toBe(PaymentStatus.Completed);
      expect(dbOrder!.razorpayPaymentId).toBe(paymentId);
    });

    it('should reject webhook verification when rawBody is missing or signature is invalid', async () => {
      const res = await request(app)
        .post('/api/payments/razorpay/webhook')
        .send({
          event: 'payment.captured',
          payload: { payment: { entity: { id: 'pay_123', order_id: 'order_123', amount: 5000 } } },
        });

      // Without x-razorpay-signature header or rawBody, webhook returns 400
      expect(res.status).toBe(400);
    });
  });
});
