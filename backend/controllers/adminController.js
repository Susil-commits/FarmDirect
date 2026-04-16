import User from '../models/User.js';
import CropListing from '../models/CropListing.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import asyncHandler from '../utils/asyncHandler.js';

// Public community stats (no auth required)
export const getPublicCommunityStats = asyncHandler(async (req, res) => {
  try {
    const totalFarmers = await User.countDocuments({ role: 'farmer', status: 'active' });
    const totalBuyers = await User.countDocuments({ role: 'buyer', status: 'active' });
    const totalCrops = await CropListing.countDocuments({ status: 'active' });
    const totalOrders = await Order.countDocuments({ orderStatus: { $in: ['delivered', 'completed'] } });
    
    res.status(200).json({
      success: true,
      data: {
        users: {
          farmers: totalFarmers || 0,
          buyers: totalBuyers || 0
        },
        crops: {
          total: totalCrops || 0
        },
        orders: {
          total: totalOrders || 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching public stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch community stats'
    });
  }
});

// Dashboard statistics
export const getDashboardStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalBuyers = await User.countDocuments({ role: 'buyer' });
  const totalFarmers = await User.countDocuments({ role: 'farmer' });
  const totalAdmins = await User.countDocuments({ role: 'admin' });
  
  const totalCrops = await CropListing.countDocuments();
  const activeCrops = await CropListing.countDocuments({ status: 'active' });
  
  const totalOrders = await Order.countDocuments();
  const pendingOrders = await Order.countDocuments({ orderStatus: 'pending' });
  const completedOrders = await Order.countDocuments({ orderStatus: 'delivered' });
  
  const totalReviews = await Review.countDocuments();
  
  // Revenue calculation (if you have a Transaction model)
  const orders = await Order.find({ orderStatus: 'delivered' });
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  
  res.status(200).json({
    success: true,
    data: {
      users: {
        total: totalUsers,
        buyers: totalBuyers,
        farmers: totalFarmers,
        admins: totalAdmins
      },
      crops: {
        total: totalCrops,
        active: activeCrops,
        inactive: totalCrops - activeCrops
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        completed: completedOrders,
        totalRevenue
      },
      reviews: totalReviews
    }
  });
});

// Get all users with filters
export const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search, status } = req.query;
  
  const skip = (page - 1) * limit;
  const query = {};
  
  if (role) {
    query.role = role;
  }
  
  if (status) {
    query.status = status;
  }
  
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { farmName: { $regex: search, $options: 'i' } }
    ];
  }
  
  const users = await User.find(query)
    .select('-password')
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });
  
  const total = await User.countDocuments(query);
  
  res.status(200).json({
    success: true,
    data: users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// Suspend/Block user
export const toggleUserStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { status } = req.body;
  
  if (!['active', 'suspended', 'banned'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status'
    });
  }
  
  const user = await User.findByIdAndUpdate(
    userId,
    { status, updatedAt: new Date() },
    { new: true }
  ).select('-password');
  
  res.status(200).json({
    success: true,
    message: `User ${status} successfully`,
    data: user
  });
});

// Delete user
export const deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  const user = await User.findById(userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  // Delete related crops if farmer
  if (user.role === 'farmer') {
    await CropListing.deleteMany({ farmerId: userId });
  }
  
  // Delete related orders if buyer
  if (user.role === 'buyer') {
    await Order.deleteMany({ buyerId: userId });
  }
  
  await User.findByIdAndDelete(userId);
  
  res.status(200).json({
    success: true,
    message: 'User deleted successfully'
  });
});

// Approve farmer KYC
export const approveFarmerKYC = asyncHandler(async (req, res) => {
  const { farmerId } = req.params;
  const { comments } = req.body;
  
  const farmer = await User.findByIdAndUpdate(
    farmerId,
    {
      kycStatus: 'verified',
      kycVerifiedAt: new Date(),
      kycComments: comments,
      status: 'active'
    },
    { new: true }
  ).select('-password');
  
  if (!farmer) {
    return res.status(404).json({
      success: false,
      message: 'Farmer not found'
    });
  }
  
  res.status(200).json({
    success: true,
    message: 'Farmer KYC approved',
    data: farmer
  });
});

// Reject farmer KYC
export const rejectFarmerKYC = asyncHandler(async (req, res) => {
  const { farmerId } = req.params;
  const { reason } = req.body;
  
  const farmer = await User.findByIdAndUpdate(
    farmerId,
    {
      kycStatus: 'rejected',
      kycRejectionReason: reason
    },
    { new: true }
  ).select('-password');
  
  if (!farmer) {
    return res.status(404).json({
      success: false,
      message: 'Farmer not found'
    });
  }
  
  res.status(200).json({
    success: true,
    message: 'Farmer KYC rejected',
    data: farmer
  });
});

// Get pending KYC approvals
export const getPendingKYC = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  
  const skip = (page - 1) * limit;
  
  const farmers = await User.find({
    role: 'farmer',
    kycStatus: 'pending'
  })
    .select('-password')
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });
  
  const total = await User.countDocuments({
    role: 'farmer',
    kycStatus: 'pending'
  });
  
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

// Get all crops with filters
export const getAllCrops = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;
  
  const skip = (page - 1) * limit;
  const query = {};
  
  if (status) {
    query.status = status;
  }
  
  if (search) {
    query.$or = [
      { cropName: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } }
    ];
  }
  
  const crops = await CropListing.find(query)
    .populate('farmerId', 'firstName lastName farmName')
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });
  
  const total = await CropListing.countDocuments(query);
  
  res.status(200).json({
    success: true,
    data: crops,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// Approve crop listing
export const approveCrop = asyncHandler(async (req, res) => {
  const { cropId } = req.params;
  
  const crop = await CropListing.findByIdAndUpdate(
    cropId,
    { listingApprovalStatus: 'approved', updatedAt: new Date() },
    { new: true }
  );
  
  if (!crop) {
    return res.status(404).json({
      success: false,
      message: 'Crop not found'
    });
  }
  
  res.status(200).json({
    success: true,
    message: 'Crop approved successfully',
    data: crop
  });
});

// Reject crop listing
export const rejectCrop = asyncHandler(async (req, res) => {
  const { cropId } = req.params;
  const { reason } = req.body;
  
  const crop = await CropListing.findByIdAndUpdate(
    cropId,
    { listingApprovalStatus: 'rejected', rejectionReason: reason },
    { new: true }
  );
  
  if (!crop) {
    return res.status(404).json({
      success: false,
      message: 'Crop not found'
    });
  }
  
  res.status(200).json({
    success: true,
    message: 'Crop rejected',
    data: crop
  });
});

// Get all orders
export const getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;
  
  const skip = (page - 1) * limit;
  const query = {};
  
  if (status) {
    query.orderStatus = status;
  }
  
  if (search) {
    query._id = { $regex: search, $options: 'i' };
  }
  
  const orders = await Order.find(query)
    .populate('buyerId', 'firstName lastName email')
    .populate('items.cropId', 'cropName')
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });
  
  const total = await Order.countDocuments(query);
  
  res.status(200).json({
    success: true,
    data: orders,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// Update order status
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { orderStatus } = req.body;
  
  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  
  if (!validStatuses.includes(orderStatus)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid order status'
    });
  }
  
  const order = await Order.findByIdAndUpdate(
    orderId,
    { orderStatus, updatedAt: new Date() },
    { new: true }
  ).populate('buyerId', 'email').populate('items.cropId', 'cropName');
  
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }
  
  res.status(200).json({
    success: true,
    message: 'Order status updated',
    data: order
  });
});

// Send announcement
export const sendAnnouncement = asyncHandler(async (req, res) => {
  const { title, message, targetRole } = req.body;
  
  // This would typically integrate with your notification system
  // For now, just return success
  
  res.status(200).json({
    success: true,
    message: 'Announcement sent successfully'
  });
});

// Get system logs
export const getSystemLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  
  // This would typically fetch from a logs collection
  // For now, return mock data
  
  res.status(200).json({
    success: true,
    data: [],
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: 0
    }
  });
});

// Get all users with their crops (for admin dashboard)
export const getUsersWithCrops = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search } = req.query;
  
  const skip = (page - 1) * limit;
  const query = {};
  
  if (role) {
    query.role = role;
  }
  
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { farmName: { $regex: search, $options: 'i' } }
    ];
  }
  
  // Get users with password included
  const users = await User.find(query)
    .select('+password')
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });
  
  // Fetch crops for each farmer
  const usersWithCrops = await Promise.all(
    users.map(async (user) => {
      const userObj = user.toObject();
      
      if (user.role === 'farmer') {
        const crops = await CropListing.find({ farmerId: user._id })
          .select('cropName category price quantity images description status');
        userObj.crops = crops;
      } else {
        userObj.crops = [];
      }
      
      return userObj;
    })
  );
  
  const total = await User.countDocuments(query);
  
  res.status(200).json({
    success: true,
    data: usersWithCrops,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});
