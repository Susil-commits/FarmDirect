import asyncHandler from '../utils/asyncHandler.js';
import CropListing from '../models/CropListing.js';
import Order from '../models/Order.js';
import User from '../models/User.js';

/**
 * PHASE 2: DATA ACCESS CONTROL
 * Role-specific endpoints for marketplace access
 */

// ============ FARMER ENDPOINTS ============
export const getFarmerCrops = asyncHandler(async (req, res) => {
  // Farmers see only their own crops
  const crops = await CropListing.find({ farmerId: req.user._id })
    .populate('farmerId', 'name email kycStatus')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: crops.length,
    data: crops
  });
});

export const getFarmerOrders = asyncHandler(async (req, res) => {
  // Farmers see orders where they are a seller
  const orders = await Order.find({ 'items.farmerId': req.user._id })
    .populate('buyerId', 'name email phone')
    .populate('items.cropId', 'cropName price')
    .populate('items.farmerId', 'name email')
    .sort({ createdAt: -1 });

  const farmerOrders = orders.map(order => ({
    ...order.toObject(),
    items: order.items.filter(item => item.farmerId._id.toString() === req.user._id.toString())
  }));

  res.status(200).json({
    success: true,
    count: farmerOrders.length,
    data: farmerOrders,
    stats: {
      totalOrders: farmerOrders.length,
      completedOrders: farmerOrders.filter(o => o.orderStatus === 'completed').length,
      pendingOrders: farmerOrders.filter(o => o.orderStatus === 'pending').length
    }
  });
});

export const getFarmerEarnings = asyncHandler(async (req, res) => {
  // Get farmer's total earnings
  const orders = await Order.find({ 
    'items.farmerId': req.user._id,
    orderStatus: 'completed'
  }).populate('items.cropId');

  let totalEarnings = 0;
  let orderCount = 0;

  orders.forEach(order => {
    order.items.forEach(item => {
      if (item.farmerId.toString() === req.user._id.toString()) {
        totalEarnings += (item.quantity * item.pricePerUnit);
        orderCount++;
      }
    });
  });

  res.status(200).json({
    success: true,
    data: {
      totalEarnings,
      orderCount,
      averagePerOrder: orderCount > 0 ? Math.round(totalEarnings / orderCount) : 0
    }
  });
});

// ============ BUYER ENDPOINTS ============
export const getBuyerApprovedCrops = asyncHandler(async (req, res) => {
  // Buyers see only approved crops from verified farmers
  const crops = await CropListing.find({ 
    listingApprovalStatus: 'approved'
  })
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
  // Buyers see only their own orders
  const orders = await Order.find({ buyerId: req.user._id })
    .populate({
      path: 'items.farmerId',
      select: 'name email phone rating'
    })
    .populate({
      path: 'items.cropId',
      select: 'cropName price description'
    })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders,
    stats: {
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, order) => sum + order.totalPrice, 0),
      completedOrders: orders.filter(o => o.orderStatus === 'completed').length
    }
  });
});

export const getBuyerWishlist = asyncHandler(async (req, res) => {
  // Buyers see their wishlist with approved crops only
  const user = await User.findById(req.user._id)
    .populate({
      path: 'wishlist',
      match: { listingApprovalStatus: 'approved' },
      populate: {
        path: 'farmerId',
        match: { kycStatus: 'verified' },
        select: 'name rating'
      }
    });

  const validWishlist = user.wishlist.filter(crop => crop.farmerId !== null);

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
  }).select('cropName price description quantity images');

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
  // Admin sees all orders with detailed info
  const orders = await Order.find()
    .populate('buyerId', 'name email phone')
    .populate('items.farmerId', 'name email')
    .populate('items.cropId', 'cropName price')
    .sort({ createdAt: -1 });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.orderStatus === 'pending').length,
    completed: orders.filter(o => o.orderStatus === 'completed').length,
    cancelled: orders.filter(o => o.orderStatus === 'cancelled').length,
    totalRevenue: orders
      .filter(o => o.orderStatus === 'completed')
      .reduce((sum, o) => sum + o.totalPrice, 0)
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
