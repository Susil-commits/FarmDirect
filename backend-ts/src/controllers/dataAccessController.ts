import { asyncHandler } from '../utils/asyncHandler.js';
import { sendError } from '../utils/apiResponse.js';
import CropListing from '../models/CropListing.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Wishlist from '../models/Wishlist.js';
import type { Request, Response } from 'express';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
let publicCropsCache: CacheEntry<any> | null = null;
const CACHE_TTL = 5 * 60 * 1000;

export const getFarmerCrops = asyncHandler(async (req: Request, res: Response) => {
  const crops = await CropListing.find({ farmerId: req.user!._id }).lean()
    .populate('farmerId', 'name email kycStatus').sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: crops.length, data: crops });
});

export const getFarmerOrders = asyncHandler(async (req: Request, res: Response) => {
  const orders = await Order.find({ farmerId: req.user!._id }).lean()
    .populate('buyerId', 'name email phone').populate('cropId', 'cropName price').populate('farmerId', 'name email')
    .sort({ createdAt: -1 });
  res.status(200).json({
    success: true, count: orders.length, data: orders,
    stats: {
      totalOrders: orders.length,
      completedOrders: orders.filter((o) => o.orderStatus === 'completed').length,
      pendingOrders: orders.filter((o) => ['confirmed', 'preparing', 'ready_for_pickup', 'picked_up'].includes(o.orderStatus)).length,
    },
  });
});

export const getFarmerEarnings = asyncHandler(async (req: Request, res: Response) => {
  const orders = await Order.find({ farmerId: req.user!._id, orderStatus: 'completed' }).lean().populate('cropId');
  const totalEarnings = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  res.status(200).json({
    success: true, data: {
      totalEarnings, orderCount: orders.length,
      averagePerOrder: orders.length > 0 ? Math.round(totalEarnings / orders.length) : 0,
    },
  });
});

export const getBuyerApprovedCrops = asyncHandler(async (_req: Request, res: Response) => {
  const crops = await CropListing.find({ listingApprovalStatus: 'approved' }).lean()
    .populate({ path: 'farmerId', match: { kycStatus: 'verified' }, select: 'name email phone address rating' })
    .sort({ createdAt: -1 });
  const validCrops = crops.filter((c) => c.farmerId !== null);
  res.status(200).json({ success: true, count: validCrops.length, data: validCrops });
});

export const getBuyerOrders = asyncHandler(async (req: Request, res: Response) => {
  const orders = await Order.find({ buyerId: req.user!._id }).lean()
    .populate('farmerId', 'name email phone rating').populate('cropId', 'cropName price description')
    .sort({ createdAt: -1 });
  res.status(200).json({
    success: true, count: orders.length, data: orders,
    stats: {
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      completedOrders: orders.filter((o) => o.orderStatus === 'completed').length,
    },
  });
});

export const getBuyerWishlist = asyncHandler(async (req: Request, res: Response) => {
  const wishlist = await Wishlist.find({ userId: req.user!._id }).populate('cropId');
  res.status(200).json({ success: true, count: wishlist.length, data: wishlist });
});

export const getPublicApprovedCrops = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', search = '', category = '' } = req.query as Record<string, string>;
  const query: Record<string, unknown> = { listingApprovalStatus: 'approved' };
  if (search) query.$or = [{ cropName: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }];
  if (category) query.category = category;

  const isCacheable = !search && !category && page === '1';
  if (isCacheable && publicCropsCache && (Date.now() - publicCropsCache.timestamp < CACHE_TTL)) {
    return res.status(200).json(publicCropsCache.data);
  }

  try {
    const crops = await CropListing.find(query).lean()
      .populate({ path: 'farmerId', match: { kycStatus: 'verified' }, select: 'name email phone address rating' })
      .limit(Number(limit) * 1).skip((Number(page) - 1) * Number(limit)).sort({ createdAt: -1 });
    const validCrops = crops.filter((c) => c.farmerId !== null);
    const total = await CropListing.countDocuments(query);
    
    const responseData = { success: true, count: validCrops.length, total, pages: Math.ceil(total / Number(limit)), currentPage: Number(page), data: validCrops };
    
    if (isCacheable) {
      publicCropsCache = { data: responseData, timestamp: Date.now() };
    }
    
    return res.status(200).json(responseData);
  } catch (error) {
    if (isCacheable && publicCropsCache) {
      console.warn('Database error fetching crops, serving stale cache', error);
      return res.status(200).json(publicCropsCache.data);
    }
    throw error;
  }
});

export const getPublicFarmerProfile = asyncHandler(async (req: Request, res: Response) => {
  const { farmerId } = req.params;
  const farmer = await User.findById(farmerId).select('name email phone address city state rating kycStatus -password');
  if (!farmer || farmer.kycStatus !== 'verified') return sendError(res, 'Farmer not found or not verified', 404);
  const crops = await CropListing.find({ farmerId, listingApprovalStatus: 'approved' }).lean().select('cropName price description quantity images');
  res.status(200).json({ success: true, data: { farmer, cropCount: crops.length, crops: crops.slice(0, 5) } });
});

export const searchCrops = asyncHandler(async (req: Request, res: Response) => {
  const { q, sortBy = 'newest', priceMin = '0', priceMax = '10000' } = req.query as Record<string, string>;
  const query: Record<string, unknown> = { listingApprovalStatus: 'approved', price: { $gte: Number(priceMin), $lte: Number(priceMax) } };
  if (q) query.$or = [{ cropName: { $regex: q, $options: 'i' } }, { description: { $regex: q, $options: 'i' } }];
  let sort: Record<string, 1 | -1> = { createdAt: -1 };
  if (sortBy === 'price-low') sort = { price: 1 };
  if (sortBy === 'price-high') sort = { price: -1 };
  if (sortBy === 'popular') sort = { sold: -1 };
  const crops = await CropListing.find(query).lean().populate({ path: 'farmerId', match: { kycStatus: 'verified' }, select: 'name rating' }).sort(sort).limit(50);
  const validCrops = crops.filter((c) => c.farmerId !== null);
  res.status(200).json({ success: true, count: validCrops.length, data: validCrops });
});

export const getAdminAllCrops = asyncHandler(async (req: Request, res: Response) => {
  const { status = 'all' } = req.query as Record<string, string>;
  const query: Record<string, unknown> = {};
  if (status !== 'all') query.listingApprovalStatus = status;
  const crops = await CropListing.find(query).lean().populate('farmerId', 'name email kycStatus').sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    stats: {
      total: crops.length,
      approved: crops.filter((c) => c.listingApprovalStatus === 'approved').length,
      pending: crops.filter((c) => c.listingApprovalStatus === 'pending').length,
      rejected: crops.filter((c) => c.listingApprovalStatus === 'rejected').length,
    },
    data: crops,
  });
});

export const getAdminAllOrders = asyncHandler(async (_req: Request, res: Response) => {
  const orders = await Order.find().lean().populate('buyerId', 'name email phone').populate('farmerId', 'name email').populate('cropId', 'cropName price').sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    stats: {
      total: orders.length,
      pending: orders.filter((o) => ['confirmed', 'preparing', 'ready_for_pickup', 'picked_up'].includes(o.orderStatus)).length,
      completed: orders.filter((o) => o.orderStatus === 'completed').length,
      cancelled: orders.filter((o) => o.orderStatus === 'cancelled').length,
      totalRevenue: orders.filter((o) => o.orderStatus === 'completed').reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    },
    data: orders,
  });
});

export const getAdminUsersByRole = asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.params;
  if (!['farmer', 'buyer', 'admin'].includes(role)) return sendError(res, 'Invalid role', 400);
  const users = await User.find({ role }).lean().select('-password').sort({ createdAt: -1 });
  res.status(200).json({
    success: true, role,
    stats: {
      total: users.length,
      verified: users.filter((u) => u.kycStatus === 'verified').length,
      pending: users.filter((u) => u.kycStatus === 'pending').length,
      rejected: users.filter((u) => u.kycStatus === 'rejected').length,
    },
    data: users,
  });
});
