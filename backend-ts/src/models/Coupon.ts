import mongoose, { Schema, type Model } from 'mongoose';
import type { ICoupon } from '../types/index.js';
import { CouponType } from '../types/enums.js';

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    description: { type: String, trim: true, default: '' },
    type: { type: String, enum: Object.values(CouponType), required: true, default: CouponType.Percentage },
    value: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, default: 0, min: 0 },
    maxDiscount: { type: Number, default: null, min: 0 },
    usageLimit: { type: Number, default: null, min: 0 },
    usedCount: { type: Number, default: 0, min: 0 },
    usedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    perUserLimit: { type: Number, default: 1, min: 1 },
    validFrom: { type: Date, default: Date.now },
    validUntil: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    applicableCategories: [{ type: String, trim: true }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

couponSchema.virtual('isExhausted').get(function (this: ICoupon): boolean {
  return this.usageLimit !== null && this.usageLimit !== undefined && this.usedCount >= this.usageLimit;
});

couponSchema.virtual('isWithinWindow').get(function (this: ICoupon): boolean {
  const now = new Date();
  if (this.validFrom && now < this.validFrom) return false;
  if (this.validUntil && now > this.validUntil) return false;
  return true;
});

couponSchema.set('toJSON', { virtuals: true });
couponSchema.set('toObject', { virtuals: true });

const Coupon: Model<ICoupon> = mongoose.model<ICoupon>('Coupon', couponSchema);
export default Coupon;
