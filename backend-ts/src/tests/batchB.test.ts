import request from 'supertest';
import app from './testApp.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import CropListing from '../models/CropListing.js';
import {
  UserRole,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  CropCategory,
  CropType,
  CropUnit,
  CropAvailability,
  ListingApprovalStatus,
} from '../types/enums.js';
import { generateToken } from '../utils/jwt.js';

describe('Batch B Money and Stock Fixes', () => {
  let farmerToken: string;
  let buyerToken: string;
  let farmerId: string;
  let buyerId: string;
  let cropId: string;

  beforeEach(async () => {
    const farmer = await User.create({
      firstName: 'Farmer',
      lastName: 'B',
      email: 'farmer.b@farm.com',
      role: UserRole.Farmer,
    });
    farmerId = farmer._id.toString();
    farmerToken = generateToken(farmer._id, UserRole.Farmer);

    const buyer = await User.create({
      firstName: 'Buyer',
      lastName: 'B',
      email: 'buyer.b@farm.com',
      role: UserRole.Buyer,
    });
    buyerId = buyer._id.toString();
    buyerToken = generateToken(buyer._id, UserRole.Buyer);

    const crop = await CropListing.create({
      farmerId: farmer._id,
      cropName: 'Alphonso Mangoes',
      cropType: CropType.Crops,
      category: CropCategory.Fruits,
      price: 200,
      quantity: 100,
      unit: CropUnit.Kg,
      description: 'Fresh farm harvest mangoes',
      pickupLocation: 'Warehouse B',
      contactNumber: '9998887776',
      availability: CropAvailability.Available,
      listingApprovalStatus: ListingApprovalStatus.Approved,
    });
    cropId = crop._id.toString();
  });

  describe('B1: updateOrderStatus payment completion checks and recordCropCompletion idempotency', () => {
    it('rejects completing an unpaid Razorpay order', async () => {
      const order = await Order.create({
        buyerId,
        farmerId,
        cropId,
        quantity: 5,
        unitPrice: 200,
        totalAmount: 1000,
        orderStatus: OrderStatus.PickedUp,
        paymentMethod: PaymentMethod.Razorpay,
        paymentStatus: PaymentStatus.Pending,
      });

      const res = await request(app)
        .put(`/api/orders/${order._id}/status`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ status: OrderStatus.Completed });

      expect(res.status).toBe(400);
      const unchanged = await Order.findById(order._id);
      expect(unchanged?.orderStatus).not.toBe(OrderStatus.Completed);
    });

    it('rejects completing a COD order when payment was not recorded', async () => {
      const order = await Order.create({
        buyerId,
        farmerId,
        cropId,
        quantity: 5,
        unitPrice: 200,
        totalAmount: 1000,
        orderStatus: OrderStatus.PickedUp,
        paymentMethod: PaymentMethod.Cod,
        paymentStatus: PaymentStatus.Pending,
      });

      const res = await request(app)
        .put(`/api/orders/${order._id}/status`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ status: OrderStatus.Completed });

      expect(res.status).toBe(400);
      const unchanged = await Order.findById(order._id);
      expect(unchanged?.orderStatus).not.toBe(OrderStatus.Completed);
    });

    it('allows completing a COD order when payment is recorded', async () => {
      const order = await Order.create({
        buyerId,
        farmerId,
        cropId,
        quantity: 5,
        unitPrice: 200,
        totalAmount: 1000,
        orderStatus: OrderStatus.PickedUp,
        paymentMethod: PaymentMethod.Cod,
        paymentStatus: PaymentStatus.Pending,
      });

      const res = await request(app)
        .put(`/api/orders/${order._id}/status`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ status: OrderStatus.Completed, paymentRecorded: true });

      expect(res.status).toBe(200);
      const updated = await Order.findById(order._id);
      expect(updated?.orderStatus).toBe(OrderStatus.Completed);
      expect(updated?.paymentStatus).toBe(PaymentStatus.Completed);
    });

    it('makes recordCropCompletion idempotent when called multiple times', async () => {
      const order = await Order.create({
        buyerId,
        farmerId,
        cropId,
        quantity: 5,
        unitPrice: 200,
        totalAmount: 1000,
        orderStatus: OrderStatus.PickedUp,
        paymentMethod: PaymentMethod.Cod,
        paymentStatus: PaymentStatus.Pending,
      });

      const res = await request(app)
        .put(`/api/orders/${order._id}/status`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ status: OrderStatus.Completed, paymentRecorded: true });

      expect(res.status).toBe(200);

      const cropAfterFirst = await CropListing.findById(cropId).lean();
      const firstUnits = cropAfterFirst?.monthlyStats?.totalUnits || 0;
      expect(firstUnits).toBe(5);

      // Simulate duplicate completion call on same completed order
      const resDup = await request(app)
        .put(`/api/orders/${order._id}/status`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ status: OrderStatus.Completed, paymentRecorded: true });
      expect([400, 200]).toContain(resDup.status);

      const cropAfterSecond = await CropListing.findById(cropId).lean();
      expect(cropAfterSecond?.monthlyStats?.totalUnits).toBe(5);
    });
  });
});
