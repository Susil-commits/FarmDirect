import request from 'supertest';
import app from './testApp.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import CropListing from '../models/CropListing.js';
import PriceSnapshot from '../models/PriceSnapshot.js';
import {
  UserRole,
  CropCategory,
  CropType,
  CropUnit,
  CropAvailability,
  ListingApprovalStatus,
  KycStatus,
} from '../types/enums.js';
import { generateToken } from '../utils/jwt.js';

describe('Batch C: Access Control and Input', () => {
  let farmerToken: string;
  let buyerToken: string;
  let farmerId: string;
  let buyerId: string;

  beforeEach(async () => {
    const farmer = await User.create({
      firstName: 'Farmer',
      lastName: 'C',
      email: 'farmer.c@farm.com',
      role: UserRole.Farmer,
    });
    farmerId = farmer._id.toString();
    farmerToken = generateToken(farmer._id, UserRole.Farmer);

    const buyer = await User.create({
      firstName: 'Buyer',
      lastName: 'C',
      email: 'buyer.c@farm.com',
      role: UserRole.Buyer,
    });
    buyerId = buyer._id.toString();
    buyerToken = generateToken(buyer._id, UserRole.Buyer);
  });

  describe('C1: escapeRegex util prevents regex syntax errors and regex wildcard injection', () => {
    it('message search with "(" does not throw 500 syntax error, and ".*" does not match all messages', async () => {
      const conversationId = (Message as any).generateConversationId(buyerId, farmerId);
      // Create two messages between buyer and farmer
      await Message.create({
        senderId: buyerId,
        receiverId: farmerId,
        conversationId,
        content: 'Hello farmer!',
      });
      await Message.create({
        senderId: buyerId,
        receiverId: farmerId,
        conversationId,
        content: 'Special crop price is (discounted)',
      });

      // 1. Search with unclosed parenthesis "(" - must return 200 and not throw 500 error
      const parenRes = await request(app)
        .get(`/api/messages/search?receiverId=${farmerId}&q=${encodeURIComponent('(')}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(parenRes.status).toBe(200);
      expect(parenRes.body.data.length).toBe(1);
      expect(parenRes.body.data[0].content).toContain('(discounted)');

      // 2. Search with ".*" - must not match every message
      const wildcardRes = await request(app)
        .get(`/api/messages/search?receiverId=${farmerId}&q=${encodeURIComponent('.*')}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(wildcardRes.status).toBe(200);
      expect(wildcardRes.body.data.length).toBe(0);
    });

    it('priceForecastService with "(" does not throw SyntaxError and ".*" does not match all crops', async () => {
      const { getPriceForecast } = await import('../services/priceForecastService.js');

      await PriceSnapshot.create({
        cropId: farmerId,
        cropName: 'Tomato',
        category: CropCategory.Vegetables,
        region: 'Pune',
        price: 30,
        at: new Date(),
      });

      // With "(", unescaped new RegExp(`^($`, 'i') would throw SyntaxError: Invalid regular expression: ^(: Unterminated group
      await expect(getPriceForecast('(', 'Pune')).resolves.toBeDefined();

      // With ".*", regex search must not match Tomato
      const res = await getPriceForecast('.*', 'Pune');
      expect(res).toBeDefined();
      expect(res.cropName).not.toBe('Tomato');
    });

    it('ai searchCrops tool with "(" does not throw error and ".*" does not match all crops', async () => {
      const { searchCropsTool } = await import('../ai/tools/searchCrops.js');

      await CropListing.create({
        farmerId,
        cropName: 'Organic Wheat',
        cropType: CropType.Crops,
        category: CropCategory.Grains,
        price: 40,
        quantity: 50,
        unit: CropUnit.Kg,
        description: 'Clean wheat harvest (Grade A)',
        pickupLocation: 'Pune',
        contactNumber: '9998887776',
        availability: CropAvailability.Available,
        listingApprovalStatus: ListingApprovalStatus.Approved,
      });

      // Search with "("
      const parenResult = await searchCropsTool.run({ query: '(' });
      expect(parenResult.foundCount).toBe(1);

      // Search with ".*"
      const wildcardResult = await searchCropsTool.run({ query: '.*' });
      expect(wildcardResult.foundCount).toBe(0);
    });

    it('listingEmbeddingService searchCropsHybrid with region "(" does not throw and ".*" does not match all', async () => {
      const { searchCropsHybrid } = await import('../services/listingEmbeddingService.js');

      await CropListing.create({
        farmerId,
        cropName: 'Fresh Apples',
        cropType: CropType.Crops,
        category: CropCategory.Fruits,
        price: 120,
        quantity: 50,
        unit: CropUnit.Kg,
        description: 'Crisp apples from (Shimla)',
        pickupLocation: 'Shimla (North)',
        contactNumber: '9998887776',
        availability: CropAvailability.Available,
        listingApprovalStatus: ListingApprovalStatus.Approved,
      });

      // Filter with region "("
      const parenResult = await searchCropsHybrid({
        query: '',
        region: '(',
      });
      expect(parenResult.total).toBe(1);

      // Filter with region ".*"
      const wildcardResult = await searchCropsHybrid({
        query: '',
        region: '.*',
      });
      expect(wildcardResult.total).toBe(0);
    });
  });

  describe('C2: farmer bulk upload KYC, row validation, and 1000 row limit', () => {
    it('requires KYC verification for bulk-upload', async () => {
      // Farmer has default KycStatus.Pending (not verified)
      const csvData = 'cropName,category,price,quantity,description\nWheat,grains,40,100,Organic wheat';
      const res = await request(app)
        .post('/api/farmer/crops/bulk-upload')
        .set('Authorization', `Bearer ${farmerToken}`)
        .attach('file', Buffer.from(csvData), 'crops.csv');

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/KYC/i);
    });

    it('rejects bulk-upload CSV if it exceeds 1000 data rows', async () => {
      // Verify farmer KYC
      await User.findByIdAndUpdate(farmerId, { kycStatus: KycStatus.Verified });

      let csv = 'cropName,category,price,quantity,description\n';
      for (let i = 0; i < 1001; i++) {
        csv += `Crop${i},grains,40,10,Description\n`;
      }

      const res = await request(app)
        .post('/api/farmer/crops/bulk-upload')
        .set('Authorization', `Bearer ${farmerToken}`)
        .attach('file', Buffer.from(csv), 'crops.csv');

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/1000 rows/i);
    });

    it('validates every row: price > 0, quantity >= 1, category in enum, discount 0-100', async () => {
      await User.findByIdAndUpdate(farmerId, { kycStatus: KycStatus.Verified });

      const csv = [
        'cropName,category,price,quantity,description,discount',
        'Crop1,grains,0,10,Zero price,10',
        'Crop2,grains,40,0,Zero quantity,10',
        'Crop3,invalid_cat,40,10,Invalid category,10',
        'Crop4,grains,40,10,Excessive discount,150',
        'ValidCrop,grains,40,10,Valid crop,10',
      ].join('\n');

      const res = await request(app)
        .post('/api/farmer/crops/bulk-upload')
        .set('Authorization', `Bearer ${farmerToken}`)
        .attach('file', Buffer.from(csv), 'crops.csv');

      expect(res.status).toBe(200);
      expect(res.body.summary.inserted).toBe(1);
      expect(res.body.summary.failed).toBe(4);
      expect(res.body.errors.length).toBe(4);
    });
  });

  describe('C3: updateCrop approval status reset and $inc restocking', () => {
    let cropId: string;

    beforeEach(async () => {
      await User.findByIdAndUpdate(farmerId, { kycStatus: KycStatus.Verified });
      const crop = await CropListing.create({
        farmerId,
        cropName: 'Approved Rice',
        cropType: CropType.Crops,
        category: CropCategory.Grains,
        price: 50,
        quantity: 100,
        unit: CropUnit.Kg,
        description: 'Original approved description',
        pickupLocation: 'Farm 1',
        contactNumber: '9998887776',
        availability: CropAvailability.Available,
        listingApprovalStatus: ListingApprovalStatus.Approved,
        specifications: { organicCertified: true },
        images: ['https://res.cloudinary.com/demo/image/upload/v1/rice.jpg'],
      });
      cropId = crop._id.toString();
    });

    it('resets listingApprovalStatus to Pending when price changes', async () => {
      const res = await request(app)
        .put(`/api/crops/${cropId}`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ price: 65 });

      expect(res.status).toBe(200);
      const updated = await CropListing.findById(cropId);
      expect(updated?.price).toBe(65);
      expect(updated?.listingApprovalStatus).toBe(ListingApprovalStatus.Pending);
    });

    it('resets listingApprovalStatus to Pending when description changes', async () => {
      const res = await request(app)
        .put(`/api/crops/${cropId}`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ description: 'New modified description' });

      expect(res.status).toBe(200);
      const updated = await CropListing.findById(cropId);
      expect(updated?.listingApprovalStatus).toBe(ListingApprovalStatus.Pending);
    });

    it('resets listingApprovalStatus to Pending when specifications change', async () => {
      const res = await request(app)
        .put(`/api/crops/${cropId}`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ specifications: { organicCertified: false, moistureContent: '12%' } });

      expect(res.status).toBe(200);
      const updated = await CropListing.findById(cropId);
      expect(updated?.listingApprovalStatus).toBe(ListingApprovalStatus.Pending);
    });

    it('uses $inc for restocking so concurrent sales are not overwritten', async () => {
      // Farmer restocks by 30 units (100 -> 130)
      // Meanwhile, an order concurrently deducted 20 units (database currently has 80)
      await CropListing.findByIdAndUpdate(cropId, { $inc: { quantity: -20 } });

      const res = await request(app)
        .put(`/api/crops/${cropId}`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ restockQuantity: 30 }); // Farmer restocks +30 units

      expect(res.status).toBe(200);
      const updated = await CropListing.findById(cropId);
      // With $inc, 80 + 30 = 110 (concurrent sale of 20 is preserved!).
      // Without $inc, it would be 130, wiping out the concurrent sale!
      expect(updated?.quantity).toBe(110);
      // Restocking alone should NOT reset approval status
      expect(updated?.listingApprovalStatus).toBe(ListingApprovalStatus.Approved);
    });
  });
});
