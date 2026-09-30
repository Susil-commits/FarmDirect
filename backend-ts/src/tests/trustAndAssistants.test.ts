import request from 'supertest';
import app from './testApp.js';
import User from '../models/User.js';
import CropListing from '../models/CropListing.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import Negotiation from '../models/Negotiation.js';
import PriceSnapshot from '../models/PriceSnapshot.js';
import AiConversation from '../models/AiConversation.js';
import EventLog from '../models/EventLog.js';
import AiUsage from '../models/AiUsage.js';
import {
  UserRole,
  UserStatus,
  KycStatus,
  CropStatus,
  CropAvailability,
  ListingApprovalStatus,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  NegotiationStatus,
} from '../types/enums.js';
import { analyzeReviewContent, generateCropReviewSummary } from '../services/reviewAnalysisService.js';
import { getNegotiationCopilotGuidance } from '../services/negotiationCopilotService.js';
import { scrubPii, sanitizeUserInput } from '../ai/guardrails.js';
import { myOrdersTool } from '../ai/tools/myOrders.js';
import { myNegotiationsTool } from '../ai/tools/myNegotiations.js';
import jwt from 'jsonwebtoken';

describe('Phase 5: Trust, Risk, Moderation & Advisory Assistants (Gate 5)', () => {
  let admin: any;
  let adminToken: string;
  let farmer: any;
  let _farmerToken: string;
  let buyerA: any;
  let buyerAToken: string;
  let buyerB: any;
  let _buyerBToken: string;
  let testCrop: any;

  beforeEach(async () => {
    const secret = process.env.JWT_SECRET || 'test_jwt_secret_key_12345';

    admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: `admin_${Date.now()}@example.com`,
      password: 'Password123!',
      role: UserRole.Admin,
      status: UserStatus.Active,
      kycStatus: KycStatus.Verified,
      isEmailVerified: true,
    });
    adminToken = jwt.sign({ id: admin._id, email: admin.email, role: admin.role }, secret, { expiresIn: '1h' });

    farmer = await User.create({
      firstName: 'Ramesh',
      lastName: 'Pradhan',
      email: `farmer_${Date.now()}@example.com`,
      password: 'Password123!',
      role: UserRole.Farmer,
      status: UserStatus.Active,
      kycStatus: KycStatus.Verified,
      isEmailVerified: true,
    });
    _farmerToken = jwt.sign({ id: farmer._id, email: farmer.email, role: farmer.role }, secret, { expiresIn: '1h' });

    buyerA = await User.create({
      firstName: 'Buyer',
      lastName: 'One',
      email: `buyer_a_${Date.now()}@example.com`,
      password: 'Password123!',
      role: UserRole.Buyer,
      status: UserStatus.Active,
      kycStatus: KycStatus.Verified,
      isEmailVerified: true,
    });
    buyerAToken = jwt.sign({ id: buyerA._id, email: buyerA.email, role: buyerA.role }, secret, { expiresIn: '1h' });

    buyerB = await User.create({
      firstName: 'Buyer',
      lastName: 'Two',
      email: `buyer_b_${Date.now()}@example.com`,
      password: 'Password123!',
      role: UserRole.Buyer,
      status: UserStatus.Active,
      kycStatus: KycStatus.Verified,
      isEmailVerified: true,
    });
    _buyerBToken = jwt.sign({ id: buyerB._id, email: buyerB.email, role: buyerB.role }, secret, { expiresIn: '1h' });

    testCrop = await CropListing.create({
      farmerId: farmer._id,
      cropName: 'Organic Bell Pepper',
      category: 'vegetables',
      cropType: 'vegetables',
      price: 60,
      quantity: 100,
      unit: 'kg',
      contactNumber: '9876543210',
      pickupLocation: 'Bhubaneswar Mandi',
      status: CropStatus.Active,
      availability: CropAvailability.Available,
      listingApprovalStatus: ListingApprovalStatus.Approved,
      description: 'Crisp and colorful bell peppers directly harvested.',
      images: ['/uploads/pepper.jpg'],
    });

    await PriceSnapshot.create({
      cropId: testCrop._id,
      cropName: 'organic bell pepper',
      category: 'vegetables',
      region: 'Odisha',
      price: 58,
      unit: 'kg',
      source: 'listing_created',
      at: new Date(),
    });
  });

  describe('T5.1 Anomaly Labeling & Admin Overrides', () => {
    it('allows an admin to confirm an anomaly with notes', async () => {
      const order = await Order.create({
        orderNumber: `ORD-TEST-${Date.now()}`,
        buyerId: buyerA._id,
        farmerId: farmer._id,
        cropId: testCrop._id,
        cropName: testCrop.cropName,
        quantity: 200,
        unitPrice: 180,
        totalAmount: 36000,
        orderStatus: OrderStatus.Confirmed,
        paymentMethod: PaymentMethod.Razorpay,
        paymentStatus: PaymentStatus.Completed,
        flaggedAsAnomaly: true,
        anomalyScore: 0.88,
        anomalyReasons: ['Unit price exceeds 3.0x market median'],
      });

      const res = await request(app)
        .post(`/api/admin/orders/${order._id}/anomaly-label`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ label: 'confirmed', notes: 'Severe price inflation confirmed by market auditor' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updated = await Order.findById(order._id);
      expect(updated?.anomalyLabel).toBe('confirmed');
      expect(updated?.anomalyLabelNotes).toContain('Severe price inflation');
      expect(updated?.flaggedAsAnomaly).toBe(true);
    });

    it('allows an admin to dismiss an anomaly and clear the risk flag', async () => {
      const order = await Order.create({
        orderNumber: `ORD-DISMISS-${Date.now()}`,
        buyerId: buyerA._id,
        farmerId: farmer._id,
        cropId: testCrop._id,
        cropName: testCrop.cropName,
        quantity: 15,
        unitPrice: 60,
        totalAmount: 900,
        orderStatus: OrderStatus.Confirmed,
        paymentMethod: PaymentMethod.Razorpay,
        paymentStatus: PaymentStatus.Completed,
        flaggedAsAnomaly: true,
        anomalyScore: 0.52,
      });

      const res = await request(app)
        .post(`/api/admin/orders/${order._id}/anomaly-label`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ label: 'dismissed', notes: 'Legitimate festival bulk order' });

      expect(res.status).toBe(200);
      const updated = await Order.findById(order._id);
      expect(updated?.anomalyLabel).toBe('dismissed');
      expect(updated?.flaggedAsAnomaly).toBe(false);
    });

    it('denies non-admin users from labeling anomalies', async () => {
      const order = await Order.create({
        orderNumber: `ORD-UNAUTH-${Date.now()}`,
        buyerId: buyerA._id,
        farmerId: farmer._id,
        cropId: testCrop._id,
        cropName: testCrop.cropName,
        quantity: 10,
        unitPrice: 60,
        totalAmount: 600,
        orderStatus: OrderStatus.Confirmed,
        paymentMethod: PaymentMethod.Cod,
        paymentStatus: PaymentStatus.Pending,
      });

      const res = await request(app)
        .post(`/api/admin/orders/${order._id}/anomaly-label`)
        .set('Authorization', `Bearer ${buyerAToken}`)
        .send({ label: 'confirmed' });

      expect(res.status).toBe(403);
    });
  });

  describe('T5.2 Review Moderation, Sentiment Analysis & Crop Summaries', () => {
    it('flags abusive or toxic review comments and prevents public display', () => {
      const toxic = analyzeReviewContent('This seller is a complete idiot and bastard, terrible produce', 1);
      expect(toxic.isFlagged).toBe(true);
      expect(toxic.flagReason).toContain('Offensive or abusive');
      expect(toxic.sentimentLabel).toBe('negative');

      const spam = analyzeReviewContent('Call me at +919876543210 or visit https://free-crypto-deals.xyz to win', 5);
      expect(spam.isFlagged).toBe(true);
      expect(spam.flagReason).toContain('Promotional');
    });

    it('accurately scores positive produce sentiment', () => {
      const positive = analyzeReviewContent('Super fresh, crisp, sweet bell peppers! Farm fresh and prompt delivery.', 5);
      expect(positive.isFlagged).toBe(false);
      expect(positive.sentimentLabel).toBe('positive');
      expect(positive.sentimentScore).toBeGreaterThan(0.3);
    });

    it('accurately scores negative produce sentiment', () => {
      const negative = analyzeReviewContent('Rotten, damaged, spoiled bell peppers with bugs and delayed transit.', 1);
      expect(negative.isFlagged).toBe(false);
      expect(negative.sentimentLabel).toBe('negative');
      expect(negative.sentimentScore).toBeLessThan(-0.3);
    });

    it('generates and caches crop review summaries and serves via endpoint', async () => {
      // Seed 3 reviews for testCrop
      await Review.create([
        {
          cropId: testCrop._id,
          userId: buyerA._id,
          rating: 5,
          comment: 'Very fresh and crispy bell peppers, arrived safely.',
          sentimentLabel: 'positive',
          sentimentScore: 0.8,
          isApproved: true,
          isFlagged: false,
        },
        {
          cropId: testCrop._id,
          userId: buyerB._id,
          rating: 4,
          comment: 'Good farm-fresh quality, packaging was neat and clean.',
          sentimentLabel: 'positive',
          sentimentScore: 0.6,
          isApproved: true,
          isFlagged: false,
        },
        {
          cropId: testCrop._id,
          userId: admin._id,
          rating: 3,
          comment: 'Decent produce, moderate size but fresh.',
          sentimentLabel: 'neutral',
          sentimentScore: 0.0,
          isApproved: true,
          isFlagged: false,
        },
      ]);

      const summary = await generateCropReviewSummary(testCrop._id, true);
      expect(summary).toBeDefined();
      expect(summary?.pros?.length).toBeGreaterThan(0);
      expect(summary?.sentimentBreakdown?.positive).toBe(2);
      expect(summary?.sentimentBreakdown?.neutral).toBe(1);

      // Verify GET endpoint
      const res = await request(app).get(`/api/reviews/crop/${testCrop._id}/summary`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary).toBeDefined();
      expect(res.body.data.pros).toBeInstanceOf(Array);
    });
  });

  describe('T5.3 Negotiation Copilot Advisory Guidance', () => {
    it('computes market-grounded buyer offer and farmer counter-offer ranges', async () => {
      const guidance = await getNegotiationCopilotGuidance({
        cropId: testCrop._id,
        cropName: 'Organic Bell Pepper',
        offeredPrice: 54,
        quantity: 25,
        role: 'buyer',
      });

      expect(guidance).toBeDefined();
      expect(guidance?.cropName).toBe('Organic Bell Pepper');
      expect(guidance?.askingPrice).toBe(60);
      expect(guidance?.marketPrice).toBe(58);

      // Buyer guidance should recommend fair discount ~7-8%
      expect(guidance?.buyerGuidance.recommendedOffer).toBeLessThan(60);
      expect(guidance?.buyerGuidance.acceptanceLikelihood).toBeGreaterThan(60);

      // Current evaluation of ₹54 offer (10% discount)
      expect(guidance?.currentEvaluation?.discountPct).toBe(10);
      expect(guidance?.currentEvaluation?.estimatedLikelihood).toBeGreaterThan(50);
      expect(guidance?.disclaimer).toContain('Suggested by AI • Advisory only');
    });

    it('serves copilot guidance through the authenticated API endpoint', async () => {
      const res = await request(app)
        .get(`/api/negotiations/copilot-guidance?cropId=${testCrop._id}&offeredPrice=55&role=buyer`)
        .set('Authorization', `Bearer ${buyerAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.buyerGuidance.recommendedOffer).toBeDefined();
      expect(res.body.data.farmerGuidance.recommendedCounter).toBeDefined();
      expect(res.body.data.disclaimer).toContain('Advisory only');
    });
  });

  describe('Gate 5 Privacy & Security Checklist Verification', () => {
    it('ensures tool calls are strictly scoped by ctx.user._id (no cross-user data leakage)', async () => {
      // Order 1 belongs to Buyer A
      await Order.create({
        orderNumber: `PRIV-ORD-A-${Date.now()}`,
        buyerId: buyerA._id,
        farmerId: farmer._id,
        cropId: testCrop._id,
        cropName: testCrop.cropName,
        quantity: 5,
        unitPrice: 60,
        totalAmount: 300,
        orderStatus: OrderStatus.Confirmed,
        paymentMethod: PaymentMethod.Razorpay,
        paymentStatus: PaymentStatus.Completed,
      });

      // Order 2 belongs to Buyer B
      await Order.create({
        orderNumber: `PRIV-ORD-B-${Date.now()}`,
        buyerId: buyerB._id,
        farmerId: farmer._id,
        cropId: testCrop._id,
        cropName: testCrop.cropName,
        quantity: 12,
        unitPrice: 60,
        totalAmount: 720,
        orderStatus: OrderStatus.Confirmed,
        paymentMethod: PaymentMethod.Razorpay,
        paymentStatus: PaymentStatus.Completed,
      });

      // Execute myOrdersTool with Buyer A's context
      const resultBuyerA = await myOrdersTool.run({}, {
        user: { _id: buyerA._id, role: 'buyer', email: buyerA.email },
      } as any);

      expect(resultBuyerA.orderCount).toBe(1);
      expect(resultBuyerA.orders[0].totalAmount).toBe('₹300');

      // Execute myOrdersTool with Buyer B's context
      const resultBuyerB = await myOrdersTool.run({}, {
        user: { _id: buyerB._id, role: 'buyer', email: buyerB.email },
      } as any);

      expect(resultBuyerB.orderCount).toBe(1);
      expect(resultBuyerB.orders[0].totalAmount).toBe('₹720');
    });

    it('ensures negotiation tool results are strictly isolated by counterparty', async () => {
      await Negotiation.create({
        cropId: testCrop._id,
        buyerId: buyerA._id,
        farmerId: farmer._id,
        originalPrice: 60,
        offeredPrice: 55,
        quantity: 10,
        status: NegotiationStatus.Pending,
      });

      await Negotiation.create({
        cropId: testCrop._id,
        buyerId: buyerB._id,
        farmerId: farmer._id,
        originalPrice: 60,
        offeredPrice: 50,
        quantity: 5,
        status: NegotiationStatus.Pending,
      });

      // Buyer A should only see Buyer A's negotiation
      const buyerAResult = await myNegotiationsTool.run({}, {
        user: { _id: buyerA._id, role: 'buyer', email: buyerA.email },
      } as any);

      expect(buyerAResult.count).toBe(1);
      expect(buyerAResult.negotiations[0].offeredPrice).toBe('₹55');

      // Buyer B should only see Buyer B's negotiation
      const buyerBResult = await myNegotiationsTool.run({}, {
        user: { _id: buyerB._id, role: 'buyer', email: buyerB.email },
      } as any);

      expect(buyerBResult.count).toBe(1);
      expect(buyerBResult.negotiations[0].offeredPrice).toBe('₹50');
    });

    it('scrubs PII (emails, phone numbers, payment card numbers) from user text before LLM dispatch', () => {
      const rawText = 'Please contact me at farmer.support@agrifarm.org or call 9876543210 regarding card 4111-2222-3333-4444.';
      const scrubbed = scrubPii(rawText);

      expect(scrubbed).not.toContain('farmer.support@agrifarm.org');
      expect(scrubbed).not.toContain('9876543210');
      expect(scrubbed).not.toContain('4111-2222-3333-4444');
      expect(scrubbed).toContain('[REDACTED_EMAIL]');
      expect(scrubbed).toContain('[REDACTED_PHONE]');
      expect(scrubbed).toContain('[REDACTED_CARD]');

      const sanitized = sanitizeUserInput('Contact +919876543210 for wholesale orders\x00\x08');
      expect(sanitized).toContain('[REDACTED_PHONE]');
      expect(sanitized).not.toContain('9876543210');
    });

    it('verifies that TTL indexes are properly registered on sensitive data collections', () => {
      const convIndexes = AiConversation.schema.indexes();
      const hasConvTtl = convIndexes.some(
        ([idx, opts]) => (idx as any).updatedAt === 1 && (opts as any)?.expireAfterSeconds > 0
      );
      expect(hasConvTtl).toBe(true);

      const eventIndexes = EventLog.schema.indexes();
      const hasEventTtl = eventIndexes.some(
        ([idx, opts]) => (idx as any).at === 1 && (opts as any)?.expireAfterSeconds > 0
      );
      expect(hasEventTtl).toBe(true);

      const usageIndexes = AiUsage.schema.indexes();
      const hasUsageTtl = usageIndexes.some(
        ([idx, opts]) => (idx as any).at === 1 && (opts as any)?.expireAfterSeconds > 0
      );
      expect(hasUsageTtl).toBe(true);
    });
  });
});
