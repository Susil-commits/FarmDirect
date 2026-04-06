import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';

// Get user profile
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId).select('-password');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  res.status(200).json({
    success: true,
    data: user
  });
});

// Update user profile
export const updateUserProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, bio, profilePicture } = req.body;
  
  const user = await User.findByIdAndUpdate(
    req.user.userId,
    { firstName, lastName, phone, bio, profilePicture, updatedAt: new Date() },
    { new: true, runValidators: true }
  ).select('-password');
  
  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: user
  });
});

// Add address
export const addAddress = asyncHandler(async (req, res) => {
  const { streetAddress, area, city, state, pincode, latitude, longitude, isDefault } = req.body;
  
  const user = await User.findById(req.user.userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  // If no address exists or isDefault is true, set as default
  if (!user.addresses) {
    user.addresses = [];
  }
  
  if (isDefault) {
    user.addresses.forEach(addr => addr.isDefault = false);
  }
  
  user.addresses.push({
    _id: new Date().getTime(),
    streetAddress,
    area,
    city,
    state,
    pincode,
    latitude,
    longitude,
    isDefault: isDefault || user.addresses.length === 0
  });
  
  await user.save();
  
  res.status(201).json({
    success: true,
    message: 'Address added successfully',
    data: user.addresses
  });
});

// Get addresses
export const getAddresses = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  res.status(200).json({
    success: true,
    data: user.addresses || []
  });
});

// Delete address
export const deleteAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;
  
  const user = await User.findById(req.user.userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  user.addresses = user.addresses.filter(addr => addr._id.toString() !== addressId);
  await user.save();
  
  res.status(200).json({
    success: true,
    message: 'Address deleted successfully'
  });
});

// Get farmer profile (public)
export const getFarmerProfile = asyncHandler(async (req, res) => {
  const { farmerId } = req.params;
  
  const farmer = await User.findById(farmerId)
    .select('firstName lastName farmName rating totalReviews profilePicture bio address cropsGrown');
  
  if (!farmer || farmer.role !== 'farmer') {
    return res.status(404).json({
      success: false,
      message: 'Farmer not found'
    });
  }
  
  res.status(200).json({
    success: true,
    data: farmer
  });
});

// Get all buyers (admin only)
export const getAllBuyers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  
  const query = { role: 'buyer' };
  
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  
  const skip = (page - 1) * limit;
  
  const buyers = await User.find(query)
    .select('-password')
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });
  
  const total = await User.countDocuments(query);
  
  res.status(200).json({
    success: true,
    data: buyers,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// Get all farmers (admin only)
export const getAllFarmers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, kycStatus } = req.query;
  
  const query = { role: 'farmer' };
  
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { farmName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (kycStatus) {
    query.kycStatus = kycStatus;
  }
  
  const skip = (page - 1) * limit;
  
  const farmers = await User.find(query)
    .select('-password')
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });
  
  const total = await User.countDocuments(query);
  
  res.status(200).json({
    success: true,
    data: farmers,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});
