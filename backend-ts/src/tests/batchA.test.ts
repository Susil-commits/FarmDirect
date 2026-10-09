import request from 'supertest';
import app from './testApp.js';
import User from '../models/User.js';
import CropListing from '../models/CropListing.js';
import { UserRole, KycStatus, ListingApprovalStatus, CropCategory } from '../types/enums.js';
import { generateToken } from '../utils/jwt.js';

describe('Batch A Security Fixes', () => {
  describe('A1: Public Data Leaks (dataAccessController)', () => {
    let farmerId: string;

    beforeEach(async () => {
      const farmer = await User.create({
        firstName: 'Secret',
        lastName: 'Farmer',
        name: 'Secret Farmer',
        email: 'secret.farmer@farm.com',
        phone: '9876543210',
        address: '123 Hidden Village, Private Lane',
        city: 'Nashik',
        state: 'Maharashtra',
        farmName: 'Secret Organic Valley',
        profilePicture: 'https://cloudinary.com/pic.jpg',
        role: UserRole.Farmer,
        kycStatus: KycStatus.Verified,
        rating: 4.8,
      });
      farmerId = farmer._id.toString();

      await CropListing.create({
        farmerId: farmer._id,
        cropName: 'Organic Alphonso Mangoes',
        category: CropCategory.Fruits,
        quantity: 50,
        unit: 'kg',
        price: 250,
        description: 'Fresh organic alphonso mangoes from farm',
        images: ['https://cloudinary.com/mango.jpg'],
        pickupLocation: 'Farm Gate 1',
        contactNumber: '9876543210',
        listingApprovalStatus: ListingApprovalStatus.Approved,
      });
    });

    it('unauthenticated GET /api/data/crops should not leak email, phone, or address', async () => {
      const res = await request(app).get('/api/data/crops');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      const farmerData = res.body.data[0].farmerId;
      expect(farmerData).toBeDefined();

      // Disallowed sensitive fields
      expect(farmerData.email).toBeUndefined();
      expect(farmerData.phone).toBeUndefined();
      expect(farmerData.address).toBeUndefined();

      // Allowed public fields
      expect(farmerData.name).toBe('Secret Farmer');
    });

    it('unauthenticated GET /api/data/farmers/:id should not leak email, phone, or address', async () => {
      const res = await request(app).get(`/api/data/farmers/${farmerId}`);
      expect(res.status).toBe(200);
      const farmerData = res.body.data.farmer;
      expect(farmerData).toBeDefined();

      // Disallowed sensitive fields
      expect(farmerData.email).toBeUndefined();
      expect(farmerData.phone).toBeUndefined();
      expect(farmerData.address).toBeUndefined();

      // Allowed public fields
      expect(farmerData.name).toBe('Secret Farmer');
    });
  });

  describe('A2: Message Controller Email Leak and profilePicture Fix', () => {
    let senderToken: string;
    let senderId: string;
    let receiverId: string;

    beforeEach(async () => {
      const sender = await User.create({
        firstName: 'Alice',
        lastName: 'Buyer',
        email: 'alice.private@farm.com',
        role: UserRole.Buyer,
        kycStatus: KycStatus.Verified,
        profilePicture: 'https://cloudinary.com/alice.jpg',
      });
      senderId = sender._id.toString();
      senderToken = generateToken(sender._id, UserRole.Buyer);

      const receiver = await User.create({
        firstName: 'Bob',
        lastName: 'Farmer',
        email: 'bob.private@farm.com',
        role: UserRole.Farmer,
        profilePicture: 'https://cloudinary.com/bob.jpg',
      });
      receiverId = receiver._id.toString();
    });

    it('sendMessage should not populate email and should populate profilePicture', async () => {
      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverId,
          content: 'Hello Bob!',
        });

      expect(res.status).toBe(201);
      const msg = res.body.data;
      expect(msg.senderId.email).toBeUndefined();
      expect(msg.receiverId.email).toBeUndefined();
      expect(msg.senderId.profilePicture).toBe('https://cloudinary.com/alice.jpg');
      expect(msg.receiverId.profilePicture).toBe('https://cloudinary.com/bob.jpg');
    });

    it('getConversations aggregate should not project email', async () => {
      await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverId,
          content: 'Hello again Bob!',
        });

      const res = await request(app)
        .get('/api/messages/conversations')
        .set('Authorization', `Bearer ${senderToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      const conversation = res.body.data[0];
      expect(conversation.otherUser.email).toBeUndefined();
      expect(conversation.otherUser.profilePicture).toBe('https://cloudinary.com/bob.jpg');
    });
  });

  describe('A3: CSRF Protection on Cookie-Authenticated Routes', () => {
    const allowedOrigin = 'http://localhost:5173';
    const evilOrigin = 'http://evil.com';
    const evilPrefixOrigin = 'http://localhost:5173.attacker.com';

    it('rejects /api/auth/refresh-token with 403 when Origin header is missing', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({});
      expect(res.status).toBe(403);
    });

    it('rejects /api/auth/refresh-token with 403 when Origin is evil.com', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .set('Origin', evilOrigin)
        .send({});
      expect(res.status).toBe(403);
    });

    it('rejects /api/auth/refresh-token with 403 when Origin uses startsWith bypass', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .set('Origin', evilPrefixOrigin)
        .send({});
      expect(res.status).toBe(403);
    });

    it('rejects evil origin with 403 even if x-requested-with header is present (no shortcut)', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .set('Origin', evilOrigin)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({});
      expect(res.status).toBe(403);
    });

    it('allows /api/auth/refresh-token when Origin is an exact match in env.corsOrigins', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .set('Origin', allowedOrigin)
        .send({});
      expect(res.status).not.toBe(403);
    });

    it('rejects /api/auth/logout with 403 when Origin header is missing', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .send({});
      expect(res.status).toBe(403);
    });

    it('rejects /api/auth/logout with 403 when Origin is evil.com', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Origin', evilOrigin)
        .send({});
      expect(res.status).toBe(403);
    });

    it('allows /api/auth/logout when Origin is an exact match in env.corsOrigins', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Origin', allowedOrigin)
        .send({});
      expect(res.status).not.toBe(403);
    });

    it('rejects un-prefixed /auth/refresh with 403 when Origin is evil or missing', async () => {
      const resMissing = await request(app).post('/auth/refresh').send({});
      expect(resMissing.status).toBe(403);
      const resEvil = await request(app).post('/auth/refresh').set('Origin', evilOrigin).send({});
      expect(resEvil.status).toBe(403);
    });

    it('allows un-prefixed /auth/refresh when Origin is an exact match', async () => {
      const res = await request(app)
        .post('/auth/refresh')
        .set('Origin', allowedOrigin)
        .send({});
      expect(res.status).not.toBe(403);
    });

    it('rejects un-prefixed /auth/logout with 403 when Origin is evil or missing', async () => {
      const resMissing = await request(app).post('/auth/logout').send({});
      expect(resMissing.status).toBe(403);
      const resEvil = await request(app).post('/auth/logout').set('Origin', evilOrigin).send({});
      expect(resEvil.status).toBe(403);
    });

    it('allows un-prefixed /auth/logout when Origin is an exact match', async () => {
      const res = await request(app)
        .post('/auth/logout')
        .set('Origin', allowedOrigin)
        .send({});
      expect(res.status).not.toBe(403);
    });
  });
});


