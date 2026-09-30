import request from 'supertest';
import app from './testApp.js';
import User from '../models/User.js';
import CropListing from '../models/CropListing.js';
import PriceSnapshot from '../models/PriceSnapshot.js';
import SalesDaily from '../models/SalesDaily.js';
import Order from '../models/Order.js';
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
} from '../types/enums.js';
import { calculateCropDaysOfCover, evaluateFarmerSmartLowStock } from '../services/inventoryService.js';
import { computeFarmerWeeklyKpis, generateWeeklyDigestForFarmer } from '../workers/weeklyDigestWorker.js';
import jwt from 'jsonwebtoken';

describe('Phase 4: Price Forecasting, Farmer Insights & Smart Inventory', () => {
  let farmer: any;
  let _farmerToken: string;
  let tomatoCrop: any;

  beforeEach(async () => {
    farmer = await User.create({
      firstName: 'Bikram',
      lastName: 'Sahu',
      email: `farmer_${Date.now()}@example.com`,
      password: 'Password123!',
      role: UserRole.Farmer,
      status: UserStatus.Active,
      kycStatus: KycStatus.Verified,
      isEmailVerified: true,
      city: 'Bhubaneswar',
      state: 'Odisha',
      phone: '9876543210',
    });

    const secret = process.env.JWT_SECRET || 'test_jwt_secret_key_12345';
    _farmerToken = jwt.sign(
      { id: farmer._id, email: farmer.email, role: farmer.role },
      secret,
      { expiresIn: '1h' }
    );

    tomatoCrop = await CropListing.create({
      farmerId: farmer._id,
      cropName: 'Fresh Tomato',
      category: 'vegetables',
      cropType: 'vegetables',
      price: 30,
      quantity: 150,
      unit: 'kg',
      lowStockThreshold: 20,
      description: 'Farm fresh tomatoes',
      images: ['/uploads/tomato.jpg'],
      pickupLocation: 'Bhubaneswar, Odisha',
      contactNumber: '9876543210',
      status: CropStatus.Active,
      availability: CropAvailability.Available,
      listingApprovalStatus: ListingApprovalStatus.Approved,
    });

    // Seed recent price snapshots
    const now = new Date();
    for (let i = 14; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      await PriceSnapshot.create({
        cropId: tomatoCrop._id,
        cropName: 'fresh tomato',
        category: 'vegetables',
        region: 'Odisha',
        price: 28 + (i % 3) * 2,
        unit: 'kg',
        at: d,
      });
    }
  });

  describe('T4.1 & T4.2: Price Forecasting Engine', () => {
    it('should generate a 14-day price forecast with confidence bounds', async () => {
      const res = await request(app)
        .get('/api/ai/price-forecast')
        .query({ cropName: 'Fresh Tomato', region: 'Odisha', daysAhead: 14 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.available).toBe(true);
      expect(res.body.cropName).toBe('fresh tomato');
      expect(res.body.region).toBe('Odisha');
      expect(Array.isArray(res.body.forecast)).toBe(true);
      expect(res.body.forecast.length).toBe(14);

      // Verify quantile ordering: p10 <= p50 <= p90
      const first = res.body.forecast[0];
      expect(first.p10).toBeLessThanOrEqual(first.p50);
      expect(first.p50).toBeLessThanOrEqual(first.p90);
      expect(typeof res.body.recommendation).toBe('string');
      expect(res.body.recommendation.length).toBeGreaterThan(10);
    });

    it('should operate safely with fallback when external ML microservice is offline', async () => {
      const res = await request(app)
        .get('/api/ai/price-forecast')
        .query({ cropName: 'Organic Potato', region: 'Punjab', daysAhead: 7 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.forecast.length).toBe(7);
      expect(res.body.modelUsed).toContain('TS-');
    });
  });

  describe('T4.4: Dynamic Days-of-Cover Smart Low Stock', () => {
    it('should calculate days of cover correctly from SalesDaily velocity', async () => {
      // 150 kg in stock. Let's record sales of 15 kg/day over last 10 days
      const now = new Date();
      for (let i = 1; i <= 10; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        d.setUTCHours(0, 0, 0, 0);
        await SalesDaily.create({
          cropId: tomatoCrop._id,
          farmerId: farmer._id,
          date: d,
          quantitySold: 15,
          revenue: 450,
          orderCount: 3,
        });
      }

      // 150 kg total sold over 14-day window = ~10.71 kg/day. Current stock 150 kg => ~14 days of cover
      const analysis = await calculateCropDaysOfCover(tomatoCrop._id, 150, 14);
      expect(analysis.daysOfCover).toBeGreaterThan(0);
      expect(analysis.dailyVelocity).toBeGreaterThan(5);

      // When stock drops to 20 kg at 10.71 kg/day => ~1.9 days of cover (Critical)
      const criticalAnalysis = await calculateCropDaysOfCover(tomatoCrop._id, 20, 14);
      expect(criticalAnalysis.daysOfCover).toBeLessThanOrEqual(3.0);
    });

    it('should evaluate farmer smart low stock listings via API', async () => {
      // Update quantity to 5 kg with recent sales to trigger critical/warning
      await CropListing.findByIdAndUpdate(tomatoCrop._id, { quantity: 5 });
      const now = new Date();
      now.setUTCHours(0, 0, 0, 0);
      await SalesDaily.create({
        cropId: tomatoCrop._id,
        farmerId: farmer._id,
        date: now,
        quantitySold: 30,
        revenue: 900,
        orderCount: 2,
      });

      const items = await evaluateFarmerSmartLowStock(farmer._id, false);
      expect(items.length).toBeGreaterThan(0);
      const tomatoItem = items.find((i) => i.cropName === 'Fresh Tomato');
      expect(tomatoItem).toBeDefined();
      expect(tomatoItem?.urgency).toMatch(/critical|warning/);
    });
  });

  describe('T4.5: Weekly Farmer Digest', () => {
    it('should compute 7-day KPIs accurately and generate digest notification', async () => {
      // Create completed orders for farmer
      const buyer = await User.create({
        firstName: 'Anita',
        lastName: 'Roy',
        email: `buyer_${Date.now()}@example.com`,
        password: 'Password123!',
        role: UserRole.Buyer,
        status: UserStatus.Active,
        kycStatus: KycStatus.Verified,
        isEmailVerified: true,
      });

      await Order.create({
        buyerId: buyer._id,
        farmerId: farmer._id,
        cropId: tomatoCrop._id,
        cropName: tomatoCrop.cropName,
        unitPrice: 30,
        quantity: 10,
        totalAmount: 300,
        orderStatus: OrderStatus.Completed,
        paymentStatus: PaymentStatus.Completed,
        paymentMethod: PaymentMethod.Cod,
      });

      const kpis = await computeFarmerWeeklyKpis(farmer._id);
      expect(kpis.orderCount).toBe(1);
      expect(kpis.totalRevenue).toBe(300);
      expect(kpis.topCropName).toBe('Fresh Tomato');

      // Generate weekly digest notification
      const notif = await generateWeeklyDigestForFarmer(farmer._id, 'en');
      expect(notif).toBeDefined();
      expect(notif.message).toContain('300');
      expect(notif.message).toContain('Fresh Tomato');
    });
  });
});
