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
});
