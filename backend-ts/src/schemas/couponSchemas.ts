import { z } from 'zod';
import { CouponType } from '../types/enums.js';

export const createCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required').trim(),
  type: z.nativeEnum(CouponType),
  value: z.number().positive('Coupon discount value must be greater than 0'),
  minOrderAmount: z.number().nonnegative().optional(),
  maxDiscountAmount: z.number().nonnegative().optional(),
  description: z.string().optional(),
  usageLimit: z.number().int().positive().nullable().optional(),
  perUserLimit: z.number().int().positive().optional(),
  validFrom: z.coerce.date().optional(),
  validUntil: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
});

export const updateCouponSchema = createCouponSchema.partial();
