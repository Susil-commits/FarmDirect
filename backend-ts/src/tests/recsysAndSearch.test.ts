import request from 'supertest';
import app from './testApp.js';
import User from '../models/User.js';
import CropListing from '../models/CropListing.js';
import Order from '../models/Order.js';
import Wishlist from '../models/Wishlist.js';
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
import { expandMultilingualQuery, syncCropEmbedding } from '../services/listingEmbeddingService.js';
import jwt from 'jsonwebtoken';

describe('Phase 3: Semantic Search & Recommender Engine', () => {
  let farmer: any;
  let buyer: any;
  let buyerToken: string;
  let potatoCrop: any;
  let tomatoCrop: any;
  let onionCrop: any;
  let mangoCrop: any;

  beforeEach(async () => {
    // 1. Create Farmer
    farmer = await User.create({
      firstName: 'Ramesh',
      lastName: 'Patel',
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

    // 2. Create Buyer
    buyer = await User.create({
      firstName: 'Priya',
      lastName: 'Sharma',
      email: `buyer_${Date.now()}@example.com`,
      password: 'Password123!',
      role: UserRole.Buyer,
      status: UserStatus.Active,
      kycStatus: KycStatus.Verified,
      isEmailVerified: true,
      city: 'Bhubaneswar',
      state: 'Odisha',
      phone: '9123456780',
    });

    const secret = process.env.JWT_SECRET || 'test_jwt_secret_key_12345';
    buyerToken = jwt.sign(
      { id: buyer._id, email: buyer.email, role: buyer.role },
      secret,
      { expiresIn: '1h' }
    );

    // 3. Create Sample Listings
    potatoCrop = await CropListing.create({
      farmerId: farmer._id,
      cropName: 'Organic Fresh Potato',
      category: 'vegetables',
      cropType: 'vegetables',
      price: 25,
      quantity: 500,
      unit: 'kg',
      description: 'Golden fresh organic potatoes direct from farm',
      images: ['/uploads/potato.jpg'],
      pickupLocation: 'Bhubaneswar, Odisha',
      contactNumber: '9876543210',
      status: CropStatus.Active,
      availability: CropAvailability.Available,
      listingApprovalStatus: ListingApprovalStatus.Approved,
      sold: 120,
      rating: 4.8,
      specifications: { organicCertified: true },
    });
    await syncCropEmbedding(potatoCrop._id);

    tomatoCrop = await CropListing.create({
      farmerId: farmer._id,
      cropName: 'Farm Fresh Red Tomato',
      category: 'vegetables',
      cropType: 'vegetables',
      price: 35,
      quantity: 300,
      unit: 'kg',
      description: 'Juicy red ripe farm tomatoes',
      images: ['/uploads/tomato.jpg'],
      pickupLocation: 'Cuttack, Odisha',
      contactNumber: '9876543210',
      status: CropStatus.Active,
      availability: CropAvailability.Available,
      listingApprovalStatus: ListingApprovalStatus.Approved,
      sold: 160,
      rating: 4.9,
      specifications: { organicCertified: true },
    });
    await syncCropEmbedding(tomatoCrop._id);

    onionCrop = await CropListing.create({
      farmerId: farmer._id,
      cropName: 'Nashik Red Onion',
      category: 'vegetables',
      cropType: 'vegetables',
      price: 30,
      quantity: 400,
      unit: 'kg',
      description: 'Crunchy pungent red onions',
      images: ['/uploads/onion.jpg'],
      pickupLocation: 'Nashik, Maharashtra',
      contactNumber: '9876543210',
      status: CropStatus.Active,
      availability: CropAvailability.Available,
      listingApprovalStatus: ListingApprovalStatus.Approved,
      sold: 140,
      rating: 4.6,
    });
    await syncCropEmbedding(onionCrop._id);

    mangoCrop = await CropListing.create({
      farmerId: farmer._id,
      cropName: 'Alphonso Ratnagiri Mango',
      category: 'fruits',
      cropType: 'crops',
      price: 150,
      quantity: 150,
      unit: 'box',
      description: 'Sweet juicy GI-tagged Alphonso mangoes',
      images: ['/uploads/mango.jpg'],
      pickupLocation: 'Ratnagiri, Maharashtra',
      contactNumber: '9876543210',
      status: CropStatus.Active,
      availability: CropAvailability.Available,
      listingApprovalStatus: ListingApprovalStatus.Approved,
      sold: 200,
      rating: 5.0,
    });
    await syncCropEmbedding(mangoCrop._id);
  });

  describe('T3.1 & T3.2: Multilingual Semantic Search', () => {
    it('should expand Hindi and Odia synonyms correctly', () => {
      const hindiPotato = expandMultilingualQuery('aloo');
      expect(hindiPotato.canonicalTerms).toContain('potato');

      const devanagariTomato = expandMultilingualQuery('टमाटर');
      expect(devanagariTomato.canonicalTerms).toContain('tomato');

      const odiaOnion = expandMultilingualQuery('ପିଆଜ');
      expect(odiaOnion.canonicalTerms).toContain('onion');

      const transliteratedMango = expandMultilingualQuery('aam');
      expect(transliteratedMango.canonicalTerms).toContain('mango');
    });

    it('should find potato listing via GET /api/crops/search?q=aloo', async () => {
      const res = await request(app).get('/api/crops/search?q=aloo');
      expect(res.status).toBe(200);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.crops.length).toBeGreaterThan(0);
      const names = res.body.crops.map((c: any) => c.cropName.toLowerCase());
      expect(names.some((n: string) => n.includes('potato'))).toBe(true);
    });

    it('should find tomato listing via GET /api/crops/search?q=tamatar', async () => {
      const res = await request(app).get('/api/crops/search?q=tamatar');
      expect(res.status).toBe(200);
      expect(res.body.crops.length).toBeGreaterThan(0);
      const names = res.body.crops.map((c: any) => c.cropName.toLowerCase());
      expect(names.some((n: string) => n.includes('tomato'))).toBe(true);
    });

    it('should support category and price filters in hybrid search', async () => {
      const res = await request(app)
        .get('/api/crops/search')
        .query({ category: 'vegetables', minPrice: 20, maxPrice: 32 });

      expect(res.status).toBe(200);
      expect(res.body.crops.length).toBeGreaterThan(0);
      for (const crop of res.body.crops) {
        expect(crop.category).toBe('vegetables');
        expect(crop.price).toBeGreaterThanOrEqual(20);
        expect(crop.price).toBeLessThanOrEqual(32);
      }
    });
  });

  describe('T3.5: Vector Similar Crops', () => {
    it('should return similar crops based on vector similarity', async () => {
      const res = await request(app).get(`/api/crops/${potatoCrop._id}/similar`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.crops)).toBe(true);
      expect(res.body.crops.length).toBeGreaterThan(0);

      // Verify the crop itself is not returned in similar crops
      const ids = res.body.crops.map((c: any) => String(c._id));
      expect(ids).not.toContain(String(potatoCrop._id));

      // Vegetables should rank higher for potato than unrelated fruits
      const topCrop = res.body.crops[0];
      expect(topCrop.category).toBe('vegetables');
    });
  });

  describe('T3.3: Hybrid Personalized Recommender', () => {
    it('should provide popularity prior for cold-start buyers', async () => {
      const res = await request(app)
        .get('/api/crops/buyer/recommended')
        .set('Authorization', `Bearer ${buyerToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.crops)).toBe(true);
      expect(res.body.crops.length).toBeGreaterThan(0);
    });

    it('should personalize recommendations based on purchase history', async () => {
      // Create order history for buyer on Tomato
      await Order.create({
        buyerId: buyer._id,
        farmerId: farmer._id,
        cropId: tomatoCrop._id,
        cropName: tomatoCrop.cropName,
        unitPrice: tomatoCrop.price,
        quantity: 5,
        totalAmount: tomatoCrop.price * 5,
        orderStatus: OrderStatus.Completed,
        paymentStatus: PaymentStatus.Completed,
        paymentMethod: PaymentMethod.Cod,
      });

      // Add Potato to Wishlist
      await Wishlist.create({
        userId: buyer._id,
        cropId: potatoCrop._id,
      });

      const res = await request(app)
        .get('/api/crops/buyer/recommended')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.crops)).toBe(true);
      expect(res.body.crops.length).toBeGreaterThan(0);
    });
  });
});
