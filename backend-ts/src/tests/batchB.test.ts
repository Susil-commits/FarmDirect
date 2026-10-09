import request from 'supertest';
import { jest } from '@jest/globals';
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

  describe('B2: paymentReconciliationWorker expiration and stock restore', () => {
    it('cancels expired unpaid Razorpay order and restores crop stock in transaction', async () => {
      const { reconcilePendingRazorpayPayments } = await import('../workers/paymentReconciliationWorker.js');
      const { setRazorpayInstance } = await import('../config/razorpay.js');

      // Mock razorpay orders.fetchPayments returning no captured payment
      setRazorpayInstance({
        orders: {
          fetchPayments: (jest.fn() as any).mockResolvedValue({ items: [] }),
        },
      });

      // Crop starts with 95 quantity, 5 sold (after placing 5 kg order)
      await CropListing.findByIdAndUpdate(cropId, {
        $set: { quantity: 95, sold: 5 },
      });

      // Order created 7 hours ago
      const sevenHoursAgo = new Date(Date.now() - 7 * 60 * 60 * 1000);
      const expiredOrder = await Order.create({
        buyerId,
        farmerId,
        cropId,
        quantity: 5,
        unitPrice: 200,
        totalAmount: 1000,
        orderStatus: OrderStatus.Confirmed,
        paymentMethod: PaymentMethod.Razorpay,
        paymentStatus: PaymentStatus.Pending,
        razorpayOrderId: 'order_test_expired_123',
        createdAt: sevenHoursAgo,
      });

      await reconcilePendingRazorpayPayments();

      const updatedOrder = await Order.findById(expiredOrder._id);
      expect(updatedOrder?.orderStatus).toBe(OrderStatus.Cancelled);
      expect(updatedOrder?.paymentStatus).toBe(PaymentStatus.Failed);

      const restoredCrop = await CropListing.findById(cropId);
      expect(restoredCrop?.quantity).toBe(100);
      expect(restoredCrop?.sold).toBe(0);
    });

    it('cancels order without razorpayOrderId older than 30 min and restores crop stock', async () => {
      const { reconcilePendingRazorpayPayments } = await import('../workers/paymentReconciliationWorker.js');

      // Crop starts with 90 quantity, 10 sold
      await CropListing.findByIdAndUpdate(cropId, {
        $set: { quantity: 90, sold: 10 },
      });

      // Order created 40 minutes ago with NO razorpayOrderId
      const fortyMinsAgo = new Date(Date.now() - 40 * 60 * 1000);
      const noRzpOrder = await Order.create({
        buyerId,
        farmerId,
        cropId,
        quantity: 10,
        unitPrice: 200,
        totalAmount: 2000,
        orderStatus: OrderStatus.Confirmed,
        paymentMethod: PaymentMethod.Razorpay,
        paymentStatus: PaymentStatus.Pending,
        createdAt: fortyMinsAgo,
      });

      await reconcilePendingRazorpayPayments();

      const updatedOrder = await Order.findById(noRzpOrder._id);
      expect(updatedOrder?.orderStatus).toBe(OrderStatus.Cancelled);
      expect(updatedOrder?.paymentStatus).toBe(PaymentStatus.Failed);

      const restoredCrop = await CropListing.findById(cropId);
      expect(restoredCrop?.quantity).toBe(100);
      expect(restoredCrop?.sold).toBe(0);
    });
  });

  describe('B3: cancelOrder and denyOrder execute in ONE MongoDB transaction', () => {
    it('rolls back order status update if crop stock restore fails during cancelOrder', async () => {
      const order = await Order.create({
        buyerId,
        farmerId,
        cropId,
        quantity: 5,
        unitPrice: 200,
        totalAmount: 1000,
        orderStatus: OrderStatus.Confirmed,
        paymentMethod: PaymentMethod.Cod,
        paymentStatus: PaymentStatus.Pending,
      });

      const spy = jest.spyOn(CropListing, 'findByIdAndUpdate').mockImplementationOnce(() => {
        throw new Error('Simulated database failure during stock restoration');
      });

      const res = await request(app)
        .patch(`/api/orders/${order._id}/cancel`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ cancellationReason: 'Buyer changed their mind' });

      expect(res.status).toBe(500);

      // Restore spy
      spy.mockRestore();

      // Check order in database: MUST NOT be cancelled because transaction rolled back
      const orderAfterFailedCancel = await Order.findById(order._id);
      expect(orderAfterFailedCancel?.orderStatus).toBe(OrderStatus.Confirmed);
    });

    it('rolls back order status update if crop stock restore fails during denyOrder', async () => {
      const order = await Order.create({
        buyerId,
        farmerId,
        cropId,
        quantity: 5,
        unitPrice: 200,
        totalAmount: 1000,
        orderStatus: OrderStatus.Confirmed,
        paymentMethod: PaymentMethod.Cod,
        paymentStatus: PaymentStatus.Pending,
      });

      const spy = jest.spyOn(CropListing, 'findByIdAndUpdate').mockImplementationOnce(() => {
        throw new Error('Simulated database failure during stock restoration');
      });

      const res = await request(app)
        .post(`/api/orders/${order._id}/deny`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ denialReason: 'Farmer out of stock' });

      expect(res.status).toBe(500);

      spy.mockRestore();

      const orderAfterFailedDeny = await Order.findById(order._id);
      expect(orderAfterFailedDeny?.orderStatus).toBe(OrderStatus.Confirmed);
    });
  });

  describe('B4: Razorpay refund on cancellation', () => {
    it('refunds captured payment on cancellation, stores refundId, and sets paymentStatus=Refunded', async () => {
      const { setRazorpayInstance } = await import('../config/razorpay.js');

      const refundMock = (jest.fn() as any).mockResolvedValue({ id: 'rfnd_mock_12345' });
      setRazorpayInstance({
        payments: {
          refund: refundMock,
        },
      });

      const order = await Order.create({
        buyerId,
        farmerId,
        cropId,
        quantity: 5,
        unitPrice: 200,
        totalAmount: 1000,
        orderStatus: OrderStatus.Confirmed,
        paymentMethod: PaymentMethod.Razorpay,
        paymentStatus: PaymentStatus.Completed,
        razorpayPaymentId: 'pay_test_refund_123',
      });

      const res = await request(app)
        .patch(`/api/orders/${order._id}/cancel`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ cancellationReason: 'Buyer requesting refund and cancellation' });

      expect(res.status).toBe(200);
      expect(refundMock).toHaveBeenCalledTimes(1);
      expect(refundMock).toHaveBeenCalledWith('pay_test_refund_123', expect.objectContaining({
        amount: 100000,
      }));

      const updated = await Order.findById(order._id);
      expect(updated?.orderStatus).toBe(OrderStatus.Cancelled);
      expect(updated?.paymentStatus).toBe('refunded');
      expect(updated?.refundId).toBe('rfnd_mock_12345');
    });

    it('is idempotent on double-cancel and does not re-issue refund', async () => {
      const { setRazorpayInstance } = await import('../config/razorpay.js');

      const refundMock = (jest.fn() as any).mockResolvedValue({ id: 'rfnd_mock_double_123' });
      setRazorpayInstance({
        payments: {
          refund: refundMock,
        },
      });

      const order = await Order.create({
        buyerId,
        farmerId,
        cropId,
        quantity: 5,
        unitPrice: 200,
        totalAmount: 1000,
        orderStatus: OrderStatus.Confirmed,
        paymentMethod: PaymentMethod.Razorpay,
        paymentStatus: PaymentStatus.Completed,
        razorpayPaymentId: 'pay_test_double_cancel',
      });

      // First cancel: succeeds and refunds
      const res1 = await request(app)
        .patch(`/api/orders/${order._id}/cancel`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ cancellationReason: 'First cancel request' });

      expect(res1.status).toBe(200);
      expect(refundMock).toHaveBeenCalledTimes(1);

      // Second cancel (double-cancel): rejected with 400 and refund NOT called again
      const res2 = await request(app)
        .patch(`/api/orders/${order._id}/cancel`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ cancellationReason: 'Second cancel attempt' });

      expect(res2.status).toBe(400);
      expect(refundMock).toHaveBeenCalledTimes(1);
    });
  });
});
