import Coupon from '../models/Coupon.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendError } from '../utils/apiResponse.js';
import { CouponType } from '../types/enums.js';
import type { ICoupon, DiscountResult } from '../types/index.js';
import type { Types } from 'mongoose';
import type { Request, Response } from 'express';

/**
 * Pure discount calculator — does NOT mutate usage counts.
 * Returns { discountAmount, finalAmount } or null if not applicable.
 */
export function computeDiscount(coupon: ICoupon | null, subtotal: number): DiscountResult | null {
  if (!coupon || typeof subtotal !== 'number') return null;
  if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) return null;

  let discountAmount = 0;
  if (coupon.type === CouponType.Percentage) {
    discountAmount = (subtotal * (coupon.value || 0)) / 100;
    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
      discountAmount = coupon.maxDiscount;
    }
  } else {
    discountAmount = coupon.value || 0;
  }

  if (discountAmount > subtotal) discountAmount = subtotal;
  if (discountAmount < 0) discountAmount = 0;

  return {
    discountAmount: Math.round(discountAmount * 100) / 100,
    finalAmount: Math.round((subtotal - discountAmount) * 100) / 100,
  };
}

export const validateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { code, amount = '0' } = req.query as { code?: string; amount?: string };
  const userId = req.user!._id;
  const subtotal = Number(amount) || 0;

  if (!code) {
    return sendError(res, 'Coupon code is required', 400);
  }

  const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
  if (!coupon || !coupon.isActive) {
    return sendError(res, 'Invalid or expired coupon code', 404);
  }

  const now = new Date();
  if (coupon.validFrom && now < coupon.validFrom) return sendError(res, 'This coupon is not active yet', 400);
  if (coupon.validUntil && now > coupon.validUntil) return sendError(res, 'This coupon has expired', 400);
  if (coupon.usageLimit !== null && coupon.usageLimit !== undefined && coupon.usedCount >= coupon.usageLimit) {
    return sendError(res, 'This coupon has reached its usage limit', 400);
  }

  const userUses = coupon.usedBy.filter((id) => id.toString() === userId.toString()).length;
  if (userUses >= coupon.perUserLimit) {
    return sendError(res, 'You have already used this coupon', 400);
  }

  const result = computeDiscount(coupon, subtotal);
  if (!result) {
    return sendError(res, `Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon`, 400);
  }

  return res.status(200).json({
    success: true,
    coupon: {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      description: coupon.description,
    },
    discountAmount: result.discountAmount,
    finalAmount: result.finalAmount,
  });
});

export async function redeemCoupon(code: string, userId: Types.ObjectId | string): Promise<ICoupon | null> {
  if (!code) return null;
  try {
    // Atomic update: only increments if usage limit has not been reached AND user hasn't exceeded per-user limit.
    // This prevents race conditions where two concurrent requests both pass the pre-check.
    const coupon = await Coupon.findOneAndUpdate(
      {
        code: code.toUpperCase().trim(),
        isActive: true,
        $or: [
          { usageLimit: null },
          { usageLimit: undefined },
          { $expr: { $lt: ['$usedCount', '$usageLimit'] } },
        ],
      },
      {
        $inc: { usedCount: 1 },
        $push: { usedBy: userId },
      },
      { new: true },
    );
    return coupon;
  } catch (err) {
    console.error('Failed to redeem coupon:', err);
    return null;
  }
}

// ---------------- Admin CRUD ----------------

export const getAllCoupons = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', active } = req.query as Record<string, string>;
  const query: Record<string, unknown> = {};
  if (active === 'true') query.isActive = true;
  if (active === 'false') query.isActive = false;

  const skip = (Number(page) - 1) * Number(limit);
  const [coupons, total] = await Promise.all([
    Coupon.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Coupon.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    coupons,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
  });
});

export const createCoupon = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await Coupon.create({ ...req.body, createdBy: req.user!._id });
  res.status(201).json({ success: true, coupon });
});

export const updateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!coupon) return sendError(res, 'Coupon not found', 404);
  res.status(200).json({ success: true, coupon });
});

export const deleteCoupon = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) return sendError(res, 'Coupon not found', 404);
  res.status(200).json({ success: true, message: 'Coupon deleted' });
});
