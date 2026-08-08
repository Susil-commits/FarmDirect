import mongoose, { Schema, type Model } from 'mongoose';
import type { IOrder } from '../types/index.js';
import { OrderStatus, PaymentMethod, PaymentStatus, CancelledBy } from '../types/enums.js';

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, unique: true, default: () => 'ORD-' + Date.now() },
    buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    farmerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    cropId: { type: Schema.Types.ObjectId, ref: 'CropListing', required: true },
    cropName: String,
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    originalAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    couponCode: { type: String, default: null, trim: true, uppercase: true },
    pickupLocation: String,
    farmerContact: String,
    buyerContact: String,
    orderStatus: { type: String, enum: Object.values(OrderStatus), default: OrderStatus.Confirmed },
    paymentMethod: { type: String, enum: Object.values(PaymentMethod), default: PaymentMethod.Cod },
    paymentStatus: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.Pending },
    razorpayOrderId: { type: String, default: null, index: true },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },
    timeline: [
      { event: String, description: String, timestamp: { type: Date, default: Date.now } },
    ],
    notes: String,
    specialInstructions: String,
    review: { rating: { type: Number, min: 1, max: 5 }, comment: String, reviewedAt: Date },
    cancelledAt: Date,
    cancellationReason: String,
    cancelledBy: { type: String, enum: Object.values(CancelledBy) },
    completedAt: Date,
    flaggedAsAnomaly: { type: Boolean, default: false },
    anomalyScore: { type: Number, default: null },
  },
  { timestamps: true },
);

orderSchema.index({ buyerId: 1 });
orderSchema.index({ farmerId: 1 });
orderSchema.index({ cropId: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ buyerId: 1, createdAt: -1 });
orderSchema.index({ farmerId: 1, createdAt: -1 });

const Order: Model<IOrder> = mongoose.model<IOrder>('Order', orderSchema);
export default Order;
