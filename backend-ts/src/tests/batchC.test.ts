import request from 'supertest';
import app from './testApp.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import CropListing from '../models/CropListing.js';
import PriceSnapshot from '../models/PriceSnapshot.js';
import Negotiation from '../models/Negotiation.js';
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
      await expect(getPriceForecast({ cropName: '(', region: 'Pune' })).resolves.toBeDefined();

      // With ".*", regex search must not match Tomato
      const res = await getPriceForecast({ cropName: '.*', region: 'Pune' });
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

      const mockCtx: any = { userId: farmerId, role: UserRole.Farmer };
      // Search with "("
      const parenResult = await searchCropsTool.run({ query: '(' }, mockCtx);
      expect(parenResult.foundCount).toBe(1);

      // Search with ".*"
      const wildcardResult = await searchCropsTool.run({ query: '.*' }, mockCtx);
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

  describe('C4: createCrop image URL validation and client aiReview rejection', () => {
    beforeEach(async () => {
      await User.findByIdAndUpdate(farmerId, { kycStatus: KycStatus.Verified });
    });

    it('rejects crop creation when image URL is not hosted on Cloudinary', async () => {
      const res = await request(app)
        .post('/api/crops')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          cropName: 'Organic Potato',
          cropType: CropType.Vegetables,
          category: CropCategory.Vegetables,
          price: 30,
          quantity: 100,
          unit: CropUnit.Kg,
          description: 'Farm fresh organic potatoes harvested today',
          pickupLocation: 'Farm 1, Cuttack',
          contactNumber: '9998887776',
          images: ['https://malicious-site.com/exploit.jpg'],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Cloudinary/i);
    });

    it('ignores client-supplied aiReview on crop creation', async () => {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dwrzxdymw';
      const validImageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/v1/potato.jpg`;

      const res = await request(app)
        .post('/api/crops')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          cropName: 'Organic Potato',
          cropType: CropType.Vegetables,
          category: CropCategory.Vegetables,
          price: 30,
          quantity: 100,
          unit: CropUnit.Kg,
          description: 'Farm fresh organic potatoes harvested today',
          pickupLocation: 'Farm 1, Cuttack',
          contactNumber: '9998887776',
          images: [validImageUrl],
          aiReview: {
            looksLikeProduce: false,
            confidence: 0.55,
            qualityGrade: 'A',
            issues: ['Fake client issue'],
            detectedCrop: 'Fake Crop',
            suggestedPrice: 123,
          },
        });

      expect(res.status).toBe(201);
      const createdCrop = await CropListing.findById(res.body.crop._id);
      expect(createdCrop).toBeDefined();
      // Client-supplied aiReview must be completely ignored (cannot inject qualityGrade, detectedCrop, or override confidence)
      expect(createdCrop?.aiReview?.qualityGrade).toBeUndefined();
      expect(createdCrop?.aiReview?.detectedCrop).toBeUndefined();
      expect(createdCrop?.aiReview?.suggestedPrice).toBeUndefined();
      expect(createdCrop?.aiReview?.confidence).not.toBe(0.55);
    });
  });

  describe('C5: Negotiation routes KYC, accept path crop checks, schema constraints and TTL', () => {
    let testCropId: string;

    beforeEach(async () => {
      // Farmer has verified KYC for crop creation
      await User.findByIdAndUpdate(farmerId, { kycStatus: KycStatus.Verified });

      const crop = await CropListing.create({
        farmerId,
        cropName: 'Alphonso Mango',
        cropType: CropType.Fruits,
        category: CropCategory.Fruits,
        price: 100,
        quantity: 50,
        unit: CropUnit.Kg,
        description: 'Fresh Ratnagiri Alphonso mangoes sweet and aromatic',
        pickupLocation: 'Ratnagiri',
        contactNumber: '9998887776',
        availability: CropAvailability.Available,
        listingApprovalStatus: ListingApprovalStatus.Approved,
      });
      testCropId = crop._id.toString();
    });

    it('requires KYC verification on negotiation routes', async () => {
      // Buyer currently has unverified KYC (default Pending)
      const res = await request(app)
        .post('/api/negotiations/offer')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          cropId: testCropId,
          offeredPrice: 80,
          quantity: 10,
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/KYC/i);
    });

    it('rejects offer with quantity < 1 or offeredPrice < 0.01 and enforces schema min constraints', async () => {
      await User.findByIdAndUpdate(buyerId, { kycStatus: KycStatus.Verified });

      // Reject non-positive quantity in API
      const resZeroQty = await request(app)
        .post('/api/negotiations/offer')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          cropId: testCropId,
          offeredPrice: 80,
          quantity: 0,
        });
      expect(resZeroQty.status).toBe(400);

      // Reject zero/negative price in API
      const resZeroPrice = await request(app)
        .post('/api/negotiations/offer')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          cropId: testCropId,
          offeredPrice: 0,
          quantity: 10,
        });
      expect(resZeroPrice.status).toBe(400);

      // Schema-level validation constraint
      const invalidNeg = new Negotiation({
        cropId: testCropId,
        buyerId,
        farmerId,
        originalPrice: 100,
        offeredPrice: 0,
        quantity: 0,
      });
      await expect(invalidNeg.validate()).rejects.toThrow();
    });

    it('respondToOffer accept path rejects if crop listingApprovalStatus is not Approved or crop is Unavailable', async () => {
      await User.findByIdAndUpdate(buyerId, { kycStatus: KycStatus.Verified });

      // Create an offer
      const offerRes = await request(app)
        .post('/api/negotiations/offer')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          cropId: testCropId,
          offeredPrice: 85,
          quantity: 5,
        });
      expect(offerRes.status).toBe(201);

      const neg = await Negotiation.findOne({ cropId: testCropId, buyerId });
      expect(neg).toBeDefined();

      // Case A: Admin unapproves or changes crop approval status to Pending
      await CropListing.findByIdAndUpdate(testCropId, { listingApprovalStatus: ListingApprovalStatus.Pending });

      const acceptResUnapproved = await request(app)
        .post(`/api/negotiations/${neg!._id}/respond`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ action: 'accept' });

      expect(acceptResUnapproved.status).toBeGreaterThanOrEqual(400);
      expect(acceptResUnapproved.body.message || acceptResUnapproved.body.error).toMatch(/approval|approved/i);

      // Restore approval but set availability to NotAvailable
      await CropListing.findByIdAndUpdate(testCropId, {
        listingApprovalStatus: ListingApprovalStatus.Approved,
        availability: CropAvailability.NotAvailable,
      });

      const acceptResUnavailable = await request(app)
        .post(`/api/negotiations/${neg!._id}/respond`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ action: 'accept' });

      expect(acceptResUnavailable.status).toBeGreaterThanOrEqual(400);
      expect(acceptResUnavailable.body.message || acceptResUnavailable.body.error).toMatch(/available/i);
    });

    it('sets expiresAt TTL to 7 days on Negotiation document', async () => {
      await User.findByIdAndUpdate(buyerId, { kycStatus: KycStatus.Verified });

      const neg = await Negotiation.create({
        cropId: testCropId,
        buyerId,
        farmerId,
        originalPrice: 100,
        offeredPrice: 80,
        quantity: 10,
      });

      expect(neg.expiresAt).toBeDefined();
      const diffMs = neg.expiresAt!.getTime() - Date.now();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      // Should be roughly 7 days in future (within 10 seconds tolerance)
      expect(Math.abs(diffMs - sevenDaysMs)).toBeLessThan(10000);
    });
  });

  describe('C6: messageController.sendMessage rejects communication between blocked users', () => {
    beforeEach(async () => {
      // Both users KYC verified
      await User.findByIdAndUpdate(farmerId, { kycStatus: KycStatus.Verified, blockedUsers: [] });
      await User.findByIdAndUpdate(buyerId, { kycStatus: KycStatus.Verified, blockedUsers: [] });
    });

    it('rejects sendMessage when sender has blocked the receiver', async () => {
      // Farmer blocks buyer
      await User.findByIdAndUpdate(farmerId, { $push: { blockedUsers: buyerId } });

      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          receiverId: buyerId,
          content: 'Hello buyer',
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/block/i);
    });

    it('rejects sendMessage when receiver has blocked the sender', async () => {
      // Buyer blocks farmer
      await User.findByIdAndUpdate(buyerId, { $push: { blockedUsers: farmerId } });

      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          receiverId: buyerId,
          content: 'Hello buyer',
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/block/i);
    });

    it('allows sendMessage when neither user has blocked the other', async () => {
      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          receiverId: buyerId,
          content: 'Hello buyer',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('C7: Zod schemas wired up with validateRequest', () => {
    let cropId: string;

    beforeEach(async () => {
      await User.findByIdAndUpdate(farmerId, { kycStatus: KycStatus.Verified });
      await User.findByIdAndUpdate(buyerId, { kycStatus: KycStatus.Verified });

      const crop = await CropListing.create({
        farmerId,
        cropName: 'Organic Barley',
        cropType: CropType.Grains,
        category: CropCategory.Grains,
        price: 45,
        quantity: 100,
        unit: CropUnit.Kg,
        description: 'Clean high quality harvested organic barley',
        pickupLocation: 'Farm 1, Sambalpur',
        contactNumber: '9876543210',
        availability: CropAvailability.Available,
        listingApprovalStatus: ListingApprovalStatus.Approved,
      });
      cropId = crop._id.toString();
    });

    it('createCrop validates request body using createCropSchema (rejects invalid phone number)', async () => {
      const res = await request(app)
        .post('/api/crops')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          cropName: 'Organic Barley',
          cropType: CropType.Grains,
          category: CropCategory.Grains,
          price: 45,
          quantity: 100,
          unit: CropUnit.Kg,
          description: 'Clean high quality harvested organic barley',
          pickupLocation: 'Farm 1, Sambalpur',
          contactNumber: '12345', // Invalid phone number per createCropSchema regex
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.errors.contactNumber).toBeDefined();
    });

    it('updateCrop validates request body using updateCropSchema (rejects negative price)', async () => {
      const res = await request(app)
        .put(`/api/crops/${cropId}`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          price: -25, // Invalid negative price per updateCropSchema
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.errors.price).toBeDefined();
    });

    it('createOrder validates request body using createOrderSchema (rejects quantity <= 0)', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .set('Idempotency-Key', 'test-key-c7-1')
        .send({
          cropId,
          quantity: 0, // Invalid quantity per createOrderSchema
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.errors.quantity).toBeDefined();
    });

    it('checkoutCart validates request body using checkoutCartSchema (rejects empty items array)', async () => {
      const res = await request(app)
        .post('/api/orders/checkout-cart')
        .set('Authorization', `Bearer ${buyerToken}`)
        .set('Idempotency-Key', 'test-key-c7-2')
        .send({
          items: [], // Invalid empty items per checkoutCartSchema
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.errors.items).toBeDefined();
    });
  });
});



