import request from 'supertest';
import app from './testApp.js';
import User from '../models/User.js';
import CropListing from '../models/CropListing.js';
import { UserRole, KycStatus, ListingApprovalStatus, CropCategory } from '../types/enums.js';

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
});
