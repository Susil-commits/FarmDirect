import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      default: () => 'ORD-' + Date.now()
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    cropId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CropListing',
      required: true
    },
    cropName: String,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true
    },
    totalAmount: {
      type: Number,
      required: true
    },
    // Coupon / discount tracking
    originalAmount: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    couponCode: {
      type: String,
      default: null,
      trim: true,
      uppercase: true,
    },
    // Pickup location (from crop listing)
    pickupLocation: String,
    // Farmer's contact number
    farmerContact: String,
    // Buyer's contact number
    buyerContact: String,
    // Order status workflow - simplified for direct farmer-buyer
    orderStatus: {
      type: String,
      enum: ['confirmed', 'preparing', 'ready_for_pickup', 'picked_up', 'completed', 'cancelled'],
      default: 'confirmed'
    },
    // Payment method (COD only - handled between farmer and buyer directly)
    paymentMethod: {
      type: String,
      enum: ['cod'],
      default: 'cod'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending'
    },
    // Timeline/tracking - farmer updates this
    timeline: [
      {
        event: String,
        description: String,
        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ],
    // Notes
    notes: String,
    specialInstructions: String,
    // Review/rating (after order completed)
    review: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      reviewedAt: Date
    },
    cancelledAt: Date,
    cancellationReason: String,
    cancelledBy: {
      type: String,
      enum: ['buyer', 'farmer', 'admin'],
    },
    completedAt: Date
  },
  { timestamps: true }
);

// Indexes for faster queries
orderSchema.index({ buyerId: 1 });
orderSchema.index({ farmerId: 1 });
orderSchema.index({ cropId: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ buyerId: 1, createdAt: -1 });
orderSchema.index({ farmerId: 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;
