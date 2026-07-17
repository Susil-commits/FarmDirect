import User from '../models/User.js';
import CropListing from '../models/CropListing.js';
import Order from '../models/Order.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendError } from '../utils/apiResponse.js';
import { OrderStatus, UserRole } from '../types/enums.js';
import type { Request, Response } from 'express';

export const getUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!._id).select('-password').lean();
  if (!user) return sendError(res, 'User not found', 404);
  res.status(200).json({ success: true, data: user });
});

export const updateUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const { firstName, lastName, phone, bio, profilePicture } = req.body as Record<string, unknown>;
  const user = await User.findByIdAndUpdate(
    req.user!._id,
    { firstName, lastName, phone, bio, profilePicture, updatedAt: new Date() },
    { new: true, runValidators: true },
  ).select('-password');
  if (!user) return sendError(res, 'User not found', 404);
  res.status(200).json({ success: true, message: 'Profile updated successfully', data: user });
});

export const updateProfilePicture = asyncHandler(async (req: Request, res: Response) => {
  if (!req.uploadedFile) return sendError(res, 'No file uploaded', 400);
  const user = await User.findByIdAndUpdate(
    req.user!._id,
    { profilePicture: req.uploadedFile.url, updatedAt: new Date() },
    { new: true },
  ).select('-password');
  if (!user) return sendError(res, 'User not found', 404);
  res.status(200).json({ success: true, message: 'Profile picture updated', url: req.uploadedFile.url, data: user });
});

export const addAddress = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as {
    streetAddress: string; area?: string; city?: string; state?: string;
    pincode?: string; latitude?: number; longitude?: number; isDefault?: boolean;
  };
  const user = await User.findById(req.user!._id);
  if (!user) { sendError(res, 'User not found', 404); return; }

  if (!user.addresses) user.addresses = [];
  if (body.isDefault) user.addresses.forEach((addr) => (addr.isDefault = false));

  user.addresses.push({
    streetAddress: body.streetAddress,
    area: body.area,
    city: body.city,
    state: body.state,
    pincode: body.pincode,
    latitude: body.latitude,
    longitude: body.longitude,
    isDefault: body.isDefault || user.addresses.length === 0,
  });
  await user.save();
  res.status(201).json({ success: true, message: 'Address added successfully', data: user.addresses });
});

export const getAddresses = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!._id);
  if (!user) return sendError(res, 'User not found', 404);
  res.status(200).json({ success: true, data: user.addresses || [] });
});

export const deleteAddress = asyncHandler(async (req: Request, res: Response) => {
  const { addressId } = req.params;
  const user = await User.findById(req.user!._id);
  if (!user) return sendError(res, 'User not found', 404);
  user.addresses = (user.addresses || []).filter((addr) => addr._id?.toString() !== addressId);
  await user.save();
  res.status(200).json({ success: true, message: 'Address deleted successfully' });
});

export const getFarmerProfile = asyncHandler(async (req: Request, res: Response) => {
  const { farmerId } = req.params;
  const farmer = await User.findById(farmerId).lean().select('firstName lastName farmName rating totalReviews profilePicture bio address cropsGrown kycStatus city state createdAt');
  if (!farmer || farmer.role !== UserRole.Farmer) return sendError(res, 'Farmer not found', 404);

  const totalListings = await CropListing.countDocuments({ farmerId: farmer._id });
  const totalSales = await Order.countDocuments({ farmerId: farmer._id, orderStatus: OrderStatus.Completed });

  res.status(200).json({
    success: true,
    data: { ...farmer, totalListings, totalSales },
  });
});

export const getAllBuyers = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', search } = req.query as Record<string, string>;
  const query: Record<string, unknown> = { role: UserRole.Buyer };
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  const skip = (Number(page) - 1) * Number(limit);
  const [buyers, total] = await Promise.all([
    User.find(query).lean().select('-password').skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
    User.countDocuments(query),
  ]);
  res.status(200).json({
    success: true, data: buyers,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
  });
});

export const getAllFarmers = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', search, kycStatus } = req.query as Record<string, string>;
  const query: Record<string, unknown> = { role: UserRole.Farmer };
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { farmName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  if (kycStatus) query.kycStatus = kycStatus;
  const skip = (Number(page) - 1) * Number(limit);
  const [farmers, total] = await Promise.all([
    User.find(query).lean().select('-password').skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
    User.countDocuments(query),
  ]);
  res.status(200).json({
    success: true, data: farmers,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
  });
});
