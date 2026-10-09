import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';
import CropListing from '../models/CropListing.js';
import PriceSnapshot from '../models/PriceSnapshot.js';
import { generateToken } from '../utils/jwt.js';
import { CropCategory, CropType, CropUnit } from '../types/enums.js';

describe('Phase 2 - Smart Listing & Multimodal Vision API', () => {
  let farmer: any;
  let buyer: any;
  let admin: any;
  let farmerToken: string;
  let buyerToken: string;
  let adminToken: string;

  beforeEach(async () => {
    await User.deleteMany({});
    await CropListing.deleteMany({});
    await PriceSnapshot.deleteMany({});

    farmer = await User.create({
      firstName: 'Ramesh',
      lastName: 'Farmer',
      email: 'ramesh@example.com',
      password: 'Password123!',
      role: 'farmer',
      isEmailVerified: true,
      kycStatus: 'verified',
    });
    farmerToken = generateToken(farmer._id, farmer.role);

    buyer = await User.create({
      firstName: 'Sita',
      lastName: 'Buyer',
      email: 'sita@example.com',
      password: 'Password123!',
      role: 'buyer',
      isEmailVerified: true,
    });
    buyerToken = generateToken(buyer._id, buyer.role);

    admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: 'Password123!',
      role: 'admin',
      isEmailVerified: true,
    });
    adminToken = generateToken(admin._id, admin.role);
  });

  describe('T2.1 & T2.2: POST /api/ai/listing-draft', () => {
    it('requires authentication and farmer/admin authorization', async () => {
      // 401 unauthenticated
      await request(app)
        .post('/api/ai/listing-draft')
        .send({ imageUrl: '/uploads/tomato.jpg' })
        .expect(401);

      // 403 unauthorized for buyers
      await request(app)
        .post('/api/ai/listing-draft')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ imageUrl: '/uploads/tomato.jpg' })
        .expect(403);

      // 200 allowed for farmer
      const farmerRes = await request(app)
        .post('/api/ai/listing-draft')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ imageUrl: '/uploads/tomato.jpg' })
        .expect(200);

      expect(farmerRes.body.success).toBe(true);
      expect(farmerRes.body.draft).toBeDefined();

      // 200 allowed for admin
      const adminRes = await request(app)
        .post('/api/ai/listing-draft')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ imageUrl: '/uploads/tomato.jpg' })
        .expect(200);

      expect(adminRes.body.success).toBe(true);
      expect(adminRes.body.draft).toBeDefined();
    });

    it('rejects requests missing an image payload with 400', async () => {
      const res = await request(app)
        .post('/api/ai/listing-draft')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ cropNameHint: 'Tomato' })
        .expect(400);

      expect(res.body.message).toContain('image');
    });

    it('generates structured produce draft for fresh produce image hint', async () => {
      const res = await request(app)
        .post('/api/ai/listing-draft')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          imageUrl: 'https://example.com/uploads/fresh_red_tomato.jpg',
          cropNameHint: 'fresh_red_tomato.jpg',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      const draft = res.body.draft;
      expect(draft.cropName.toLowerCase()).toContain('tomato');
      expect(draft.category).toBe('vegetables');
      expect(draft.cropType).toBe('vegetables');
      expect(draft.looksLikeProduce).toBe(true);
      expect(['A', 'B', 'C']).toContain(draft.qualityGrade);
      expect(draft.confidence).toBeGreaterThan(0.5);
      expect(draft.description.length).toBeGreaterThan(15);
      expect(draft.issues).toEqual([]);
    });

    it('identifies non-produce image and flags sanity issues for admin review', async () => {
      const res = await request(app)
        .post('/api/ai/listing-draft')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          imageUrl: 'https://example.com/uploads/store_receipt_invoice.jpg',
          cropNameHint: 'store_receipt_invoice.jpg',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      const draft = res.body.draft;
      expect(draft.looksLikeProduce).toBe(false);
      expect(draft.issues).toContain('not_produce');
      expect(draft.qualityGrade).toBe('C');
      expect(draft.description).toContain('Advisory Notice');
    });

    it('identifies blurry or watermarked images in issues', async () => {
      const res = await request(app)
        .post('/api/ai/listing-draft')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          imageUrl: 'https://example.com/uploads/blurry_unfocused_smear.jpg',
          cropNameHint: 'blurry_unfocused_smear.jpg',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.draft.looksLikeProduce).toBe(false);
      expect(res.body.draft.issues).toContain('blurry');
    });
  });

  describe('T2.3: GET /api/ai/price-guidance', () => {
    it('returns 400 when cropName is missing', async () => {
      await request(app)
        .get('/api/ai/price-guidance')
        .expect(400);
    });

    it('returns insufficient_data: true when fewer than 2 snapshots exist', async () => {
      const res = await request(app)
        .get('/api/ai/price-guidance?cropName=Pomegranate')
        .expect(200);

      expect(res.body.success).toBe(true);
      const guidance = res.body.data;
      expect(guidance.sufficientData).toBe(false);
      expect(guidance.status).toBe('insufficient_data');
      expect(guidance.count).toBe(0);
      expect(guidance.p25).toBeUndefined();
      expect(guidance.median).toBeUndefined();
      expect(guidance.p75).toBeUndefined();
    });

    it('computes statistical p25, median, p75 market corridor from snapshots', async () => {
      const dummyCropId = new mongoose.Types.ObjectId();
      const prices = [20, 25, 30, 35, 40, 45, 50]; // Sorted: 20, 25, 30, 35, 40, 45, 50. median=35, p25=25, p75=45
      const now = Date.now();

      for (let i = 0; i < prices.length; i++) {
        await PriceSnapshot.create({
          cropId: dummyCropId,
          cropName: 'Tomato',
          category: 'vegetables',
          region: 'Cuttack, Odisha',
          price: prices[i],
          unit: 'kg',
          isOrganic: false,
          at: new Date(now - (prices.length - i) * 86400000),
        });
      }

      const res = await request(app)
        .get('/api/ai/price-guidance?cropName=Tomato&region=Cuttack')
        .expect(200);

      expect(res.body.success).toBe(true);
      const guidance = res.body.data;
      expect(guidance.sufficientData).toBe(true);
      expect(guidance.status).toBe('available');
      expect(guidance.count).toBe(7);
      expect(guidance.minPrice).toBe(20);
      expect(guidance.maxPrice).toBe(50);
      expect(guidance.median).toBe(35);
      expect(guidance.p25).toBe(25);
      expect(guidance.p75).toBe(45);
      expect(guidance.suggestedPrice).toBe(35);
    });

    it('applies organic premium multiplier when isOrganic=true is requested', async () => {
      const dummyCropId = new mongoose.Types.ObjectId();
      const prices = [30, 30, 30, 30]; // Conventionally 30

      for (const price of prices) {
        await PriceSnapshot.create({
          cropId: dummyCropId,
          cropName: 'Basmati Rice',
          category: 'grains',
          region: 'Punjab',
          price,
          unit: 'kg',
          isOrganic: false,
        });
      }

      const res = await request(app)
        .get('/api/ai/price-guidance?cropName=Basmati%20Rice&isOrganic=true')
        .expect(200);

      expect(res.body.success).toBe(true);
      const guidance = res.body.data;
      // Organic multiplier is 1.15 (+15%), so 30 * 1.15 = 35
      expect(guidance.suggestedPrice).toBeGreaterThan(30);
    });
  });

  describe('Advisory aiReview Persistence in CropListing', () => {
    it('ignores client-supplied aiReview signals when farmer publishes listing', async () => {
      const listingPayload = {
        cropName: 'Fresh Tomato',
        category: CropCategory.Vegetables,
        cropType: CropType.Vegetables,
        quantity: 500,
        unit: CropUnit.Kg,
        price: 35,
        description: 'Fresh farm harvest organic tomatoes ripe and graded',
        pickupLocation: 'Pipili, Puri, Odisha',
        contactNumber: '9876543210',
        aiReview: {
          looksLikeProduce: true,
          confidence: 0.92,
          qualityGrade: 'A',
          issues: [],
          detectedCrop: 'Fresh Tomato',
          suggestedPrice: 35,
        },
      };

      const res = await request(app)
        .post('/api/crops')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send(listingPayload)
        .expect(201);

      expect(res.body.message).toBeDefined();
      const crop = res.body.crop;
      expect(crop).toBeDefined();
      // Client-supplied aiReview must be ignored for security (cannot set qualityGrade or override confidence)
      expect(crop.aiReview?.qualityGrade).toBeUndefined();
      expect(crop.aiReview?.suggestedPrice).toBeUndefined();
      expect(crop.aiReview?.confidence).not.toBe(0.92);

      // Verify in DB directly
      const saved = await CropListing.findById(crop._id);
      expect(saved?.aiReview?.qualityGrade).toBeUndefined();
      expect(saved?.aiReview?.suggestedPrice).toBeUndefined();
      expect(saved?.aiReview?.confidence).not.toBe(0.92);
    });
  });
});
