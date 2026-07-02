import Coupon from '../models/Coupon.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Compute the discount for a coupon against a given subtotal.
 * Pure function — does NOT mutate usage counts or check limits.
 * Returns { discountAmount, finalAmount } or null if not applicable.
 *
 * @param {object} coupon  - Coupon document
 * @param {number} subtotal - pre-discount subtotal
 */
export const computeDiscount = (coupon, subtotal) => {
  if (!coupon || typeof subtotal !== 'number') return null;

  // Minimum order threshold
  if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
    return null;
  }

  let discountAmount = 0;
  if (coupon.type === 'percentage') {
    discountAmount = (subtotal * (coupon.value || 0)) / 100;
    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
      discountAmount = coupon.maxDiscount;
    }
  } else {
    // fixed amount
    discountAmount = coupon.value || 0;
  }

  // Discount can't exceed the subtotal
  if (discountAmount > subtotal) discountAmount = subtotal;
  if (discountAmount < 0) discountAmount = 0;

  return {
    discountAmount: Math.round(discountAmount * 100) / 100,
    finalAmount: Math.round((subtotal - discountAmount) * 100) / 100,
  };
};

/**
 * Validate a coupon code against a subtotal + user.
 * GET /api/coupons/validate?code=SAVE10&amount=500
 * @access Private (any authenticated user)
 */
export const validateCoupon = asyncHandler(async (req, res) => {
  const { code, amount = 0 } = req.query;
  const userId = req.user._id;
  const subtotal = Number(amount) || 0;

  if (!code) {
    return res.status(400).json({ success: false, message: 'Coupon code is required' });
  }

  const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

  if (!coupon || !coupon.isActive) {
    return res.status(404).json({ success: false, message: 'Invalid or expired coupon code' });
  }

  // Validity window
  const now = new Date();
  if (coupon.validFrom && now < coupon.validFrom) {
    return res.status(400).json({ success: false, message: 'This coupon is not active yet' });
  }
  if (coupon.validUntil && now > coupon.validUntil) {
    return res.status(400).json({ success: false, message: 'This coupon has expired' });
  }

  // Global usage cap
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return res.status(400).json({ success: false, message: 'This coupon has reached its usage limit' });
  }

  // Per-user limit
  const userUses = coupon.usedBy.filter(
    (id) => id.toString() === userId.toString()
  ).length;
  if (userUses >= coupon.perUserLimit) {
    return res
      .status(400)
      .json({ success: false, message: 'You have already used this coupon' });
  }

  // Compute discount (also enforces minOrderAmount)
  const result = computeDiscount(coupon, subtotal);
  if (!result) {
    return res.status(400).json({
      success: false,
      message: `Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon`,
    });
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

/**
 * Mark a coupon as used by a user (called after a successful order).
 * Idempotent-safe: increments usedCount + pushes userId.
 */
export const redeemCoupon = async (code, userId) => {
  if (!code) return null;
  try {
    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (!coupon) return null;

    coupon.usedCount = (coupon.usedCount || 0) + 1;
    if (userId && !coupon.usedBy.some((id) => id.toString() === userId.toString())) {
      coupon.usedBy.push(userId);
    }
    await coupon.save();
    return coupon;
  } catch (err) {
    console.error('Failed to redeem coupon:', err);
    return null;
  }
};

/* ---------------- Admin CRUD ---------------- */

// GET /api/admin/coupons
export const getAllCoupons = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, active } = req.query;
  const query = {};
  if (active === 'true') query.isActive = true;
  if (active === 'false') query.isActive = false;

  const skip = (page - 1) * limit;
  const [coupons, total] = await Promise.all([
    Coupon.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Coupon.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    coupons,
    pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
  });
});

// POST /api/admin/coupons
export const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, coupon });
});

// PATCH /api/admin/coupons/:id
export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
  res.status(200).json({ success: true, coupon });
});

// DELETE /api/admin/coupons/:id
export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
  res.status(200).json({ success: true, message: 'Coupon deleted' });
});
