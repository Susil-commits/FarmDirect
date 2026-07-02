import mongoose from 'mongoose';

/**
 * Coupon model
 * Supports percentage and fixed-amount discounts with usage limits,
 * validity windows, minimum-order thresholds, and optional category scoping.
 */
const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    // 'percentage' => value is a 0-100 percent; 'fixed' => value is a flat amount
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
      default: 'percentage',
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    // Minimum subtotal required before the coupon applies
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Cap on the discount amount (mainly for percentage coupons)
    maxDiscount: {
      type: Number,
      default: null,
      min: 0,
    },
    // Total number of times this coupon may be redeemed (null = unlimited)
    usageLimit: {
      type: Number,
      default: null,
      min: 0,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Users who have redeemed (for per-user limits + fraud prevention)
    usedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    perUserLimit: {
      type: Number,
      default: 1,
      min: 1,
    },
    validFrom: {
      type: Date,
      default: Date.now,
    },
    validUntil: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Optional category scoping (empty array = applies to all categories)
    applicableCategories: [
      {
        type: String,
        trim: true,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// Virtual: whether the coupon has reached its global usage cap
couponSchema.virtual('isExhausted').get(function () {
  return this.usageLimit !== null && this.usedCount >= this.usageLimit;
});

// Virtual: whether the coupon is within its validity window
couponSchema.virtual('isWithinWindow').get(function () {
  const now = new Date();
  if (this.validFrom && now < this.validFrom) return false;
  if (this.validUntil && now > this.validUntil) return false;
  return true;
});

export default mongoose.model('Coupon', couponSchema);
