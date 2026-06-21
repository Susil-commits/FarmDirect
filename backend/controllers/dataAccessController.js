import asyncHandler from '../utils/asyncHandler.js';
import CropListing from '../models/CropListing.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Wishlist from '../models/Wishlist.js';

/**
 * PHASE 2: DATA ACCESS CONTROL
 * Role-specific endpoints for marketplace access
 */

// ============ FARMER ENDPOINTS ============
export const getFarmerCrops = asyncHandler(async (req, res) => {
  // Farmers see only their own crops
  const crops = await CropListing.find({ farmerId: req.user._id })
    .lean()
    .populate('farmerId', 'name email kycStatus')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: crops.length,
    data: crops
  });
});

export const getFarmerOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ farmerId: req.user._id })
    .lean()
    .populate('buyerId', 'name email phone')
    .populate('cropId', 'cropName price')
    .populate('farmerId', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders,
    stats: {
      totalOrders: orders.length,
      completedOrders: orders.filter(o => o.orderStatus === 'completed').length,
      pendingOrders: orders.filter(o => ['confirmed', 'preparing', 'ready_for_pickup', 'picked_up'].includes(o.orderStatus)).length
    }
  });
});

export const getFarmerEarnings = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    farmerId: req.user._id,
    orderStatus: 'completed'
  }).lean().populate('cropId');

  let totalEarnings = 0;

  orders.forEach(order => {
    totalEarnings += order.totalAmount;
  });

  res.status(200).json({
    success: true,
    data: {
      totalEarnings,
      orderCount: orders.length,
      averagePerOrder: orders.length > 0 ? Math.round(totalEarnings / orders.length) : 0
    }
  });
});

// ============ BUYER ENDPOINTS ============
export const getBuyerApprovedCrops = asyncHandler(async (req, res) => {
  // Buyers see only approved crops from verified farmers
  const crops = await CropListing.find({
    listingApprovalStatus: 'approved'
  })
    .lean()
    .populate({
      path: 'farmerId',
      match: { kycStatus: 'verified' },
      select: 'name email phone address rating'
    })
    .sort({ createdAt: -1 });

  // Filter out crops where farmer is not verified
  const validCrops = crops.filter(crop => crop.farmerId !== null);

  res.status(200).json({
    success: true,
    count: validCrops.length,
    data: validCrops
  });
});

export const getBuyerOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ buyerId: req.user._id })
    .lean()
    .populate('farmerId', 'name email phone rating')
    .populate('cropId', 'cropName price description')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders,
    stats: {
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, order) => sum + order.totalAmount, 0),
      completedOrders: orders.filter(o => o.orderStatus === 'completed').length
    }
  });
});

export const getBuyerWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ userId: req.user._id })
    .populate({
      path: 'items.cropId',
      match: { listingApprovalStatus: 'approved' },
      populate: {
        path: 'farmerId',
        match: { kycStatus: 'verified' },
        select: 'name rating'
      }
    });

  if (!wishlist) {
    return res.status(200).json({
      success: true,
      count: 0,
      data: []
    });
  }

  const validWishlist = wishlist.items.filter(item => item.cropId && item.cropId.farmerId !== null);

  res.status(200).json({
    success: true,
    count: validWishlist.length,
    data: validWishlist
  });
});

// ============ GUEST ENDPOINTS (Public) ============
export const getPublicApprovedCrops = asyncHandler(async (req, res) => {
  // Guests/Public see approved crops from verified farmers only
  const { page = 1, limit = 20, search = '', category = '' } = req.query;

  const query = {
    listingApprovalStatus: 'approved'
  };

  if (search) {
    query.$or = [
      { cropName: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  if (category) {
    query.category = category;
  }

  const crops = await CropListing.find(query)
    .lean()
    .populate({
      path: 'farmerId',
      match: { kycStatus: 'verified' },
      select: 'name email phone address rating'
    })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

  // Filter for verified farmers only
  const validCrops = crops.filter(crop => crop.farmerId !== null);

  const total = await CropListing.countDocuments(query);

  res.status(200).json({
    success: true,
    count: validCrops.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
    data: validCrops
  });
});

export const getPublicFarmerProfile = asyncHandler(async (req, res) => {
  // Guests can see public farmer profile (verified farms only)
  const { farmerId } = req.params;

  const farmer = await User.findById(farmerId)
    .select('name email phone address city state rating kycStatus -password');

  if (!farmer || farmer.kycStatus !== 'verified') {
    return res.status(404).json({
      success: false,
      message: 'Farmer not found or not verified'
    });
  }

  const crops = await CropListing.find({
    farmerId,
    listingApprovalStatus: 'approved'
  }).lean().select('cropName price description quantity images');

  res.status(200).json({
    success: true,
    data: {
      farmer,
      cropCount: crops.length,
      crops: crops.slice(0, 5) // Show first 5 crops
    }
  });
});

export const searchCrops = asyncHandler(async (req, res) => {
  // Public search with filters (approved crops only)
  const { q, sortBy = 'newest', priceMin = 0, priceMax = 10000 } = req.query;

  const query = {
    listingApprovalStatus: 'approved',
    price: { $gte: priceMin, $lte: priceMax }
  };

  if (q) {
    query.$or = [
      { cropName: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } }
    ];
  }

  let sort = { createdAt: -1 };
  if (sortBy === 'price-low') sort = { price: 1 };
  if (sortBy === 'price-high') sort = { price: -1 };
  if (sortBy === 'popular') sort = { 'popularity': -1 };

  const crops = await CropListing.find(query)
    .lean()
    .populate({
      path: 'farmerId',
      match: { kycStatus: 'verified' },
      select: 'name rating'
    })
    .sort(sort)
    .limit(50);

  const validCrops = crops.filter(crop => crop.farmerId !== null);

  res.status(200).json({
    success: true,
    count: validCrops.length,
    data: validCrops
  });
});

// ============ ADMIN OVERVIEW ENDPOINTS ============
export const getAdminAllCrops = asyncHandler(async (req, res) => {
  // Admin sees all crops with approval status
  const { status = 'all' } = req.query;

  let query = {};
  if (status !== 'all') {
    query.listingApprovalStatus = status;
  }

  const crops = await CropListing.find(query)
    .lean()
    .populate('farmerId', 'name email kycStatus')
    .sort({ createdAt: -1 });

  const stats = {
    total: crops.length,
    approved: crops.filter(c => c.listingApprovalStatus === 'approved').length,
    pending: crops.filter(c => c.listingApprovalStatus === 'pending').length,
    rejected: crops.filter(c => c.listingApprovalStatus === 'rejected').length
  };

  res.status(200).json({
    success: true,
    stats,
    data: crops
  });
});

export const getAdminAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .lean()
    .populate('buyerId', 'name email phone')
    .populate('farmerId', 'name email')
    .populate('cropId', 'cropName price')
    .sort({ createdAt: -1 });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => ['confirmed', 'preparing', 'ready_for_pickup', 'picked_up'].includes(o.orderStatus)).length,
    completed: orders.filter(o => o.orderStatus === 'completed').length,
    cancelled: orders.filter(o => o.orderStatus === 'cancelled').length,
    totalRevenue: orders
      .filter(o => o.orderStatus === 'completed')
      .reduce((sum, o) => sum + o.totalAmount, 0)
  };

  res.status(200).json({
    success: true,
    stats,
    data: orders
  });
});

export const getAdminUsersByRole = asyncHandler(async (req, res) => {
  // Admin gets users filtered by role
  const { role } = req.params;

  if (!['farmer', 'buyer', 'admin'].includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role'
    });
  }

  const users = await User.find({ role })
    .lean()
    .select('-password')
    .sort({ createdAt: -1 });

  const stats = {
    total: users.length,
    verified: users.filter(u => u.kycStatus === 'verified').length,
    pending: users.filter(u => u.kycStatus === 'pending').length,
    rejected: users.filter(u => u.kycStatus === 'rejected').length
  };

  res.status(200).json({
    success: true,
    role,
    stats,
    data: users
  });
});
