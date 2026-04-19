import User from '../models/User.js';
import CropListing from '../models/CropListing.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import Wishlist from '../models/Wishlist.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import asyncHandler from '../utils/asyncHandler.js';
import { invalidationStrategies } from '../utils/cache.js';

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
  // Only count VERIFIED users (after KYC approval)
  const totalUsers = await User.countDocuments({ kycStatus: 'verified' });
  const totalBuyers = await User.countDocuments({ role: 'buyer', kycStatus: 'verified' });
  const totalFarmers = await User.countDocuments({ role: 'farmer', kycStatus: 'verified' });
  const totalAdmins = await User.countDocuments({ role: 'admin' });
  
  const totalCrops = await CropListing.countDocuments();
  const activeCrops = await CropListing.countDocuments({ status: 'active' });
  
  const totalOrders = await Order.countDocuments();
  const pendingOrders = await Order.countDocuments({ orderStatus: 'pending' });
  const completedOrders = await Order.countDocuments({ orderStatus: 'delivered' });
  
  const totalReviews = await Review.countDocuments();
  
  // Count PENDING KYC (not yet approved/rejected)
  const pendingKYC = await User.countDocuments({ kycStatus: 'pending' });
  
  // Revenue calculation (if you have a Transaction model)
  const orders = await Order.find({ orderStatus: 'delivered' });
  const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  
  // Return REAL data only - no mock data fallback
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
        totalRevenue: totalRevenue
      },
      reviews: totalReviews,
      pendingKYC: pendingKYC
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
  const { status, reason } = req.body;
  
  if (!['active', 'suspended', 'banned'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status'
    });
  }
  
  const user = await User.findByIdAndUpdate(
    userId,
    { status, suspensionReason: reason, updatedAt: new Date() },
    { new: true }
  ).select('-password');
  
  // Send notification if suspending or banning
  if (status === 'suspended' || status === 'banned') {
    try {
      import('../models/Notification.js').then(async (NotifModule) => {
        const Notification = NotifModule.default;
        await Notification.create({
          userId: userId,
          title: status === 'suspended' ? 'Account Suspended' : 'Account Banned',
          message: `Your account has been ${status}. Reason: ${reason || 'Your account violated our terms of service'}. Please contact support for more information.`,
          type: 'general',
          priority: 'high'
        });
      });
    } catch (err) {
      console.error('Notification creation error:', err);
    }
  }
  
  res.status(200).json({
    success: true,
    message: `User ${status} successfully`,
    data: user
  });
});

// Delete user
export const deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { reason } = req.body;
  
  const user = await User.findById(userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  const userName = `${user.firstName} ${user.lastName}`;
  
  console.log(`🗑️ Admin deleting user: ${userName} (${user.email})`);

  // Delete all related data
  if (user.role === 'farmer') {
    // Delete farmer's crop listings
    await CropListing.deleteMany({ farmerId: userId });
    console.log('🌾 Deleted crop listings');
  }

  // Delete orders where user is buyer or farmer
  await Order.deleteMany({ $or: [{ buyerId: userId }, { farmerId: userId }] });
  console.log('📦 Deleted orders');

  // Delete reviews
  await Review.deleteMany({ $or: [{ reviewerId: userId }, { revieweeId: userId }] });
  console.log('⭐ Deleted reviews');

  // Delete wishlist items
  await Wishlist.deleteMany({ userId: userId });
  console.log('❤️ Deleted wishlist items');

  // Delete notifications
  await Notification.deleteMany({ userId: userId });
  console.log('🔔 Deleted notifications');

  // Delete user
  await User.findByIdAndDelete(userId);
  console.log(`✅ User deleted: ${user.email}`);
  
  res.status(200).json({
    success: true,
    message: `User ${userName} and all associated data have been deleted successfully`
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
  
  // Send approval notification
  try {
    import('../models/Notification.js').then(async (NotifModule) => {
      const Notification = NotifModule.default;
      await Notification.create({
        userId: farmerId,
        title: 'KYC Approved ✅',
        message: `Congratulations! Your KYC has been approved. Your account is now active and you can start listing crops on FarmDirect. ${comments ? `Admin notes: ${comments}` : ''}`,
        type: 'general',
        priority: 'high'
      });
    });
  } catch (err) {
    console.error('Notification creation error:', err);
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
  
  // Send rejection notification
  try {
    import('../models/Notification.js').then(async (NotifModule) => {
      const Notification = NotifModule.default;
      await Notification.create({
        userId: farmerId,
        title: 'KYC Rejected ❌',
        message: `Your KYC application has been rejected. Reason: ${reason}. Please contact support to reapply with correct documents.`,
        type: 'general',
        priority: 'high'
      });
    });
  } catch (err) {
    console.error('Notification creation error:', err);
  }
  
  res.status(200).json({
    success: true,
    message: 'Farmer KYC rejected',
    data: farmer
  });
});

// Debug endpoint: Get all users with their KYC status
export const debugGetAllUsersKYCStatus = asyncHandler(async (req, res) => {
  const users = await User.find({})
    .select('firstName lastName email role kycStatus status createdAt')
    .sort({ createdAt: -1 });

  console.log(`🔍 Total users in database: ${users.length}`);
  
  const summary = {
    total: users.length,
    byRole: {},
    byKYCStatus: {},
    byStatus: {}
  };
  
  users.forEach(user => {
    // By role
    if (!summary.byRole[user.role]) summary.byRole[user.role] = [];
    summary.byRole[user.role].push({
      name: user.firstName,
      email: user.email,
      kycStatus: user.kycStatus,
      status: user.status
    });
    
    // By KYC status
    if (!summary.byKYCStatus[user.kycStatus]) summary.byKYCStatus[user.kycStatus] = 0;
    summary.byKYCStatus[user.kycStatus]++;
    
    // By status
    if (!summary.byStatus[user.status]) summary.byStatus[user.status] = 0;
    summary.byStatus[user.status]++;
  });

  res.status(200).json({
    success: true,
    debug: true,
    summary,
    users: users
  });
});

// Get pending KYC approvals (supports both farmers and buyers)
export const getPendingKYC = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role = 'farmer' } = req.query;
  
  const skip = (page - 1) * limit;
  
  // Support both singular and plural forms: 'farmer'/'farmers', 'buyer'/'buyers'
  let queryRole = role.toLowerCase().replace(/s$/, ''); // Remove trailing 's' for plural
  
  const validRoles = ['farmer', 'buyer'];
  if (!validRoles.includes(queryRole)) {
    queryRole = 'farmer'; // Default to farmer
  }
  
  console.log(`📋 Fetching pending KYC for role: ${queryRole} (received: ${role})`);
  
  const users = await User.find({
    role: queryRole,
    kycStatus: 'pending'
  })
    .select('-password')
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });
  
  const total = await User.countDocuments({
    role: queryRole,
    kycStatus: 'pending'
  });

  console.log(`✅ Found ${total} pending KYC users for role: ${queryRole}`);
  console.log('Users:', users.map(u => ({ id: u._id, email: u.email, name: u.firstName, role: u.role, kycStatus: u.kycStatus })));

  // Return REAL data only - no mock data
  res.status(200).json({
    success: true,
    data: users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: total,
      pages: Math.ceil(total / limit)
    }
  });
});

// Get rejected KYC (admin can view and delete)
export const getRejectedKYC = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role = 'buyer' } = req.query;
  
  const skip = (page - 1) * limit;
  
  // Support both singular and plural forms
  let queryRole = role.toLowerCase().replace(/s$/, '');
  const validRoles = ['farmer', 'buyer'];
  if (!validRoles.includes(queryRole)) {
    queryRole = 'buyer';
  }
  
  console.log(`📋 Fetching REJECTED KYC for role: ${queryRole}`);
  
  const users = await User.find({
    role: queryRole,
    kycStatus: 'rejected'
  })
    .select('-password')
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });
  
  const total = await User.countDocuments({
    role: queryRole,
    kycStatus: 'rejected'
  });

  console.log(`✅ Found ${total} rejected KYC users for role: ${queryRole}`);

  res.status(200).json({
    success: true,
    data: users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: total,
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

// ==================== ANALYTICS ====================

// Get admin dashboard analytics
export const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalFarmers = await User.countDocuments({ role: 'farmer' });
  const totalBuyers = await User.countDocuments({ role: 'buyer' });
  const pendingKYC = await User.countDocuments({ kycStatus: 'pending', role: 'farmer' });

  const totalCrops = await CropListing.countDocuments();
  const approvedCrops = await CropListing.countDocuments({ listingApprovalStatus: 'approved' });
  const pendingCrops = await CropListing.countDocuments({ listingApprovalStatus: 'pending' });

  const totalOrders = await Order.countDocuments();
  const completedOrders = await Order.countDocuments({ orderStatus: 'delivered' });
  const pendingOrders = await Order.countDocuments({ orderStatus: 'verification_pending' });

  const orders = await Order.find().select('totalAmount');
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  res.status(200).json({
    success: true,
    analytics: {
      users: {
        total: totalUsers,
        farmers: totalFarmers,
        buyers: totalBuyers,
        pendingKYC
      },
      crops: {
        total: totalCrops,
        approved: approvedCrops,
        pending: pendingCrops
      },
      orders: {
        total: totalOrders,
        completed: completedOrders,
        pending: pendingOrders
      },
      revenue: totalRevenue
    }
  });
});

// Get farmer-specific analytics
export const getFarmerAnalytics = asyncHandler(async (req, res) => {
  const farmer = await User.findById(req.params.id);
  if (!farmer || farmer.role !== 'farmer') {
    return res.status(404).json({ success: false, message: 'Farmer not found' });
  }

  const crops = await CropListing.find({ farmerId: farmer._id });
  const orders = await Order.find({ 'items.farmerId': farmer._id });

  const totalEarnings = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrders = orders.length;
  const deliveredOrders = orders.filter(o => o.orderStatus === 'delivered').length;

  res.status(200).json({
    success: true,
    farmer: {
      _id: farmer._id,
      name: farmer.name,
      email: farmer.email
    },
    analytics: {
      crops: crops.length,
      orders: totalOrders,
      deliveredOrders,
      totalEarnings,
      rating: farmer.rating,
      kycStatus: farmer.kycStatus
    },
    recentOrders: orders.slice(-10)
  });
});

// Get buyer-specific analytics
export const getBuyerAnalytics = asyncHandler(async (req, res) => {
  const buyer = await User.findById(req.params.id);
  if (!buyer || buyer.role !== 'buyer') {
    return res.status(404).json({ success: false, message: 'Buyer not found' });
  }

  const orders = await Order.find({ buyerId: buyer._id });
  const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const completedOrders = orders.filter(o => o.orderStatus === 'delivered').length;

  res.status(200).json({
    success: true,
    buyer: {
      _id: buyer._id,
      name: buyer.name,
      email: buyer.email
    },
    analytics: {
      orders: orders.length,
      completedOrders,
      totalSpent,
      rating: buyer.rating
    },
    recentOrders: orders.slice(-10)
  });
});

// ==================== AUDIT LOGS ====================

// Log admin action to audit trail
export const logAdminAction = async (adminId, action, resourceType, resourceId, changes = {}, reason = '') => {
  try {
    const admin = await User.findById(adminId);
    await AuditLog.create({
      adminId,
      adminEmail: admin?.email || 'unknown',
      action,
      resourceType,
      resourceId,
      changes,
      reason,
      status: 'success',
      timestamp: new Date()
    });

    // Invalidate admin cache
    invalidationStrategies.adminAction();
  } catch (err) {
    console.error('Audit log error:', err);
  }
};

// Get audit logs
export const getAuditLogs = asyncHandler(async (req, res) => {
  const { action, adminId, page = 1, limit = 50 } = req.query;

  const query = {};
  if (action && action !== 'all') query.action = action;
  if (adminId) query.adminId = adminId;

  const skip = (page - 1) * limit;

  const logs = await AuditLog.find(query)
    .populate('adminId', 'name email')
    .skip(skip)
    .limit(Number(limit))
    .sort({ timestamp: -1 });

  const total = await AuditLog.countDocuments(query);

  res.status(200).json({
    success: true,
    logs,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    }
  });
});

// Change user role with audit log
export const changeUserRole = asyncHandler(async (req, res) => {
  const { newRole } = req.body;

  if (!['farmer', 'buyer', 'admin'].includes(newRole)) {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const oldRole = user.role;
  user.role = newRole;
  await user.save();

  // Log action
  await logAdminAction(
    req.user._id,
    'USER_ROLE_CHANGED',
    'User',
    user._id,
    { before: { role: oldRole }, after: { role: newRole } }
  );

  invalidationStrategies.userChanged(user._id);

  res.status(200).json({
    success: true,
    message: 'User role updated successfully',
    user
  });
});

// Get all approved farmers
export const getApprovedFarmers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  
  const skip = (page - 1) * limit;
  const query = {
    role: 'farmer',
    kycStatus: 'verified',
    status: 'active'
  };
  
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { farmName: { $regex: search, $options: 'i' } }
    ];
  }
  
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

// Get all approved buyers
export const getApprovedBuyers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  
  const skip = (page - 1) * limit;
  const query = {
    role: 'buyer',
    kycStatus: 'verified',
    status: 'active'
  };
  
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  
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

// Get all suspended users
export const getSuspendedUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  
  const skip = (page - 1) * limit;
  const query = {
    status: { $in: ['suspended', 'banned'] }
  };
  
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
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

// Freeze a crop (mark as inactive/suspended)
export const freezeCrop = asyncHandler(async (req, res) => {
  const { cropId } = req.params;
  const { reason } = req.body;
  
  const crop = await CropListing.findByIdAndUpdate(
    cropId,
    {
      status: 'inactive',
      freezeReason: reason,
      frozenAt: new Date(),
      frozenBy: req.user._id
    },
    { new: true }
  );
  
  if (!crop) {
    return res.status(404).json({
      success: false,
      message: 'Crop not found'
    });
  }
  
  // Create notification for farmer
  try {
    import('../models/Notification.js').then(async (NotifModule) => {
      const Notification = NotifModule.default;
      const farmer = await User.findById(crop.farmerId);
      if (farmer) {
        await Notification.create({
          userId: crop.farmerId,
          title: 'Crop Suspended',
          message: `Your crop "${crop.cropName}" has been suspended. Reason: ${reason}`,
          type: 'general',
          relatedId: cropId,
          priority: 'high'
        });
      }
    });
  } catch (err) {
    console.error('Notification creation error:', err);
  }
  
  res.status(200).json({
    success: true,
    message: 'Crop frozen successfully',
    data: crop
  });
});

// Delete a crop
export const deleteCrop = asyncHandler(async (req, res) => {
  const { cropId } = req.params;
  const { reason } = req.body;
  
  const crop = await CropListing.findById(cropId);
  
  if (!crop) {
    return res.status(404).json({
      success: false,
      message: 'Crop not found'
    });
  }
  
  const cropName = crop.cropName;
  const farmerId = crop.farmerId;
  
  // Delete crop
  await CropListing.findByIdAndDelete(cropId);
  
  // Create notification for farmer
  try {
    import('../models/Notification.js').then(async (NotifModule) => {
      const Notification = NotifModule.default;
      const farmer = await User.findById(farmerId);
      if (farmer) {
        await Notification.create({
          userId: farmerId,
          title: 'Crop Deleted',
          message: `Your crop "${cropName}" has been deleted from marketplace. Reason: ${reason}`,
          type: 'general',
          priority: 'high'
        });
      }
    });
  } catch (err) {
    console.error('Notification creation error:', err);
  }
  
  res.status(200).json({
    success: true,
    message: 'Crop deleted successfully',
    data: { id: cropId }
  });
});
