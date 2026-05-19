import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import CropListing from '../models/CropListing.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import Wishlist from '../models/Wishlist.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import asyncHandler from '../utils/asyncHandler.js';
import { invalidationStrategies } from '../utils/cache.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  
  // Revenue calculation using MongoDB aggregation (avoids pulling all orders into memory)
  const revenueResult = await Order.aggregate([
    { $match: { orderStatus: 'delivered' } },
    { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
  ]);
  const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;
  const deliveredOrderCount = revenueResult.length > 0 ? revenueResult[0].count : 0;
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
    .sort({ createdAt: -1 })
    .lean();
  
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

// Suspend/Block/Unfreeze user
export const toggleUserStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { status, reason } = req.body;
  const adminUser = req.user;
  
  if (!['active', 'suspended', 'banned'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status'
    });
  }
  
  const previousUser = await User.findById(userId).select('-password');
  if (!previousUser) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  const user = await User.findByIdAndUpdate(
    userId,
    { status, suspensionReason: status !== 'active' ? reason : '', updatedAt: new Date() },
    { new: true }
  ).select('-password');
  
  // Build notification title & message based on status
  let notifTitle, notifMessage, auditAction;
  
  if (status === 'suspended') {
    notifTitle = 'Account Suspended ⚠️';
    notifMessage = `Your account has been suspended. Reason: ${reason || 'Violation of platform terms'}. Contact support at support@farmdirect.com for more information.`;
    auditAction = 'USER_SUSPENDED';
  } else if (status === 'banned') {
    notifTitle = 'Account Banned 🚫';
    notifMessage = `Your account has been permanently banned. Reason: ${reason || 'Severe violation of platform terms'}. This action cannot be reversed.`;
    auditAction = 'USER_BANNED';
  } else {
    // Unfrozen / reactivated
    notifTitle = 'Account Reactivated ✅';
    notifMessage = `Your account has been reactivated. You now have full access to the platform again. Welcome back!`;
    auditAction = 'USER_UPDATED';
  }
  
  // Send in-app notification
  try {
    await Notification.create({
      userId: userId,
      title: notifTitle,
      message: notifMessage,
      type: 'general',
      priority: 'high'
    });
  } catch (err) {
    console.error('Notification creation error:', err);
  }
  
  // Create audit log
  try {
    await AuditLog.create({
      adminId: adminUser._id,
      adminEmail: adminUser.email,
      action: auditAction,
      resourceType: 'User',
      resourceId: userId,
      resourceDetails: `${user.firstName} ${user.lastName} (${user.email})`,
      changes: {
        before: { status: previousUser.status },
        after: { status: user.status }
      },
      reason: status !== 'active' ? reason : 'Account reactivated by admin',
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || 'Unknown',
      status: 'success'
    });
  } catch (auditErr) {
    console.error('Audit log creation error:', auditErr);
  }
  
  res.status(200).json({
    success: true,
    message: `User ${status === 'active' ? 'reactivated' : status} successfully`,
    data: user
  });
});

// Delete user
export const deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { reason } = req.body;
  const adminUser = req.user;
  
  const user = await User.findById(userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  const userName = `${user.firstName} ${user.lastName}`;
  const userEmail = user.email;
  const userRole = user.role;
  

  // ─── Send in-app notification BEFORE deletion ───
  try {
    await Notification.create({
      userId: userId,
      title: 'Account Deleted 🗑️',
      message: `Your FarmDirect account has been permanently deleted. Reason: ${reason || 'Violation of platform terms of service'}. If you believe this was done in error, contact support.`,
      type: 'general',
      priority: 'high'
    });
  } catch (notifErr) {
    console.error('Deletion notification error:', notifErr);
  }

  // ─── Delete all associated data ───
  if (userRole === 'farmer') {
    await CropListing.deleteMany({ farmerId: userId });
  }

  await Order.deleteMany({ $or: [{ buyerId: userId }, { farmerId: userId }] });

  await Review.deleteMany({ $or: [{ reviewerId: userId }, { revieweeId: userId }] });

  await Wishlist.deleteMany({ userId: userId });

  await Notification.deleteMany({ userId: userId });

  // ─── Delete the user ───
  await User.findByIdAndDelete(userId);

  // ─── Create audit log (AFTER deletion so it's not cascaded) ───
  try {
    await AuditLog.create({
      adminId: adminUser._id,
      adminEmail: adminUser.email,
      action: 'USER_DELETED',
      resourceType: 'User',
      resourceId: userId,
      resourceDetails: `${userName} (${userEmail})`,
      reason: reason || 'Deleted by admin',
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || 'Unknown',
      status: 'success'
    });
  } catch (auditErr) {
    console.error('Audit log error:', auditErr);
  }
  
  res.status(200).json({
    success: true,
    message: `User ${userName} and all associated data have been deleted successfully`
  });
});

// Approve user KYC (handles both farmers and buyers)
export const approveUserKYC = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { comments } = req.body;
  
  const user = await User.findByIdAndUpdate(
    userId,
    {
      kycStatus: 'verified',
      kycVerifiedAt: new Date(),
      kycComments: comments,
      status: 'active',
      kycResultSeen: false // Show congrats page on next login
    },
    { new: true }
  ).select('-password');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  // Send role-specific approval notification
  try {
    const roleMessage = user.role === 'farmer'
      ? 'You can now list your crops on the marketplace and start selling!'
      : 'You can now browse the marketplace and place orders!';
    await Notification.create({
      userId: userId,
      title: 'KYC Approved ✅',
      message: `Congratulations! Your KYC has been approved. ${roleMessage} ${comments ? `Admin notes: ${comments}` : ''}`,
      type: 'general',
      priority: 'high'
    });
  } catch (err) {
    console.error('Notification creation error:', err);
  }

  // Create audit log
  try {
    await AuditLog.create({
      adminId: req.user._id,
      adminEmail: req.user.email,
      action: 'KYC_APPROVED',
      resourceType: 'KYC',
      resourceId: userId,
      resourceDetails: `${user.firstName} ${user.lastName} (${user.email})`,
      reason: comments || 'KYC documents verified',
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || 'Unknown',
      status: 'success'
    });
  } catch (auditErr) {
    console.error('Audit log error:', auditErr);
  }
  
  res.status(200).json({
    success: true,
    message: 'User KYC approved',
    data: user
  });
});

// Reject user KYC (handles both farmers and buyers)
export const rejectUserKYC = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { reason } = req.body;
  
  const user = await User.findByIdAndUpdate(
    userId,
    {
      kycStatus: 'rejected',
      kycRejectionReason: reason,
      kycResultSeen: false // Show sorry page on next login
    },
    { new: true }
  ).select('-password');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  // Send rejection notification (static import - already imported at top of file)
  try {
    await Notification.create({
      userId: userId,
      title: 'KYC Rejected ❌',
      message: `Your KYC application has been rejected. Reason: ${reason}. You can delete your account or re-submit your documents for verification.`,
      type: 'general',
      priority: 'high'
    });
  } catch (err) {
    console.error('Notification creation error:', err);
  }

  // Create audit log
  try {
    await AuditLog.create({
      adminId: req.user._id,
      adminEmail: req.user.email,
      action: 'KYC_REJECTED',
      resourceType: 'KYC',
      resourceId: userId,
      resourceDetails: `${user.firstName} ${user.lastName} (${user.email})`,
      reason: reason || 'KYC documents rejected',
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || 'Unknown',
      status: 'success'
    });
  } catch (auditErr) {
    console.error('Audit log error:', auditErr);
  }
  
  res.status(200).json({
    success: true,
    message: 'User KYC rejected',
    data: user
  });
});

// Mark KYC result as seen (called after user views congrats/sorry page)
export const markKYCResultSeen = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { kycResultSeen: true },
    { new: true }
  ).select('-password');
  
  res.status(200).json({
    success: true,
    message: 'KYC result marked as seen',
    data: user
  });
});

// Debug endpoint: Get all users with their KYC status
export const debugGetAllUsersKYCStatus = asyncHandler(async (req, res) => {
  const users = await User.find({})
    .select('firstName lastName email role kycStatus status createdAt')
    .sort({ createdAt: -1 });

  
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
  
  
  const users = await User.find({
    role: queryRole,
    kycStatus: 'pending'
  })
    .select('-password')
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 })
    .lean();
  
  const total = await User.countDocuments({
    role: queryRole,
    kycStatus: 'pending'
  });


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
  
  
  const users = await User.find({
    role: queryRole,
    kycStatus: 'rejected'
  })
    .select('-password')
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 })
    .lean();
  
  const total = await User.countDocuments({
    role: queryRole,
    kycStatus: 'rejected'
  });


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
  ).populate('farmerId', 'name email');
  
  if (!crop) {
    return res.status(404).json({
      success: false,
      message: 'Crop not found'
    });
  }

  // Send approval notification to farmer
  try {
    await Notification.create({
      userId: crop.farmerId._id,
      title: 'Crop Approved ✅',
      message: `Your crop listing "${crop.cropName}" has been approved and is now visible to buyers!`,
      type: 'general',
      priority: 'high',
      link: `/my-crops`,
      data: {
        cropId: crop._id,
        cropName: crop.cropName
      }
    });
  } catch (err) {
    console.error('Notification creation error:', err);
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
  ).populate('farmerId', 'name email');
  
  if (!crop) {
    return res.status(404).json({
      success: false,
      message: 'Crop not found'
    });
  }

  // Send rejection notification to farmer
  try {
    await Notification.create({
      userId: crop.farmerId._id,
      title: 'Crop Rejected ❌',
      message: `Your crop listing "${crop.cropName}" has been rejected. Reason: ${reason || 'Not specified'}. You can review the details and resubmit.`,
      type: 'general',
      priority: 'high',
      link: `/my-crops`,
      data: {
        cropId: crop._id,
        cropName: crop.cropName,
        rejectionReason: reason
      }
    });
  } catch (err) {
    console.error('Notification creation error:', err);
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
  const { orderStatus, cancellationReason } = req.body;

  const validStatuses = ['confirmed', 'preparing', 'ready_for_pickup', 'picked_up', 'completed', 'cancelled'];

  if (!validStatuses.includes(orderStatus)) {
    return res.status(400).json({
      success: false,
      message: `Invalid order status. Must be one of: ${validStatuses.join(', ')}`
    });
  }

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Validate status transitions (same rules as farmer update)
  const validTransitions = {
    confirmed: ['preparing', 'cancelled'],
    preparing: ['ready_for_pickup', 'cancelled'],
    ready_for_pickup: ['picked_up', 'cancelled'],
    picked_up: ['completed'],
    completed: [],
    cancelled: [],
  };

  if (!validTransitions[order.orderStatus]?.includes(orderStatus)) {
    return res.status(400).json({
      success: false,
      message: `Cannot transition from "${order.orderStatus}" to "${orderStatus}"`
    });
  }

  const statusDescriptions = {
    preparing: 'Admin: Order preparation started',
    ready_for_pickup: 'Admin: Order marked ready for pickup',
    picked_up: 'Admin: Order marked as picked up',
    completed: 'Admin: Order marked as completed',
    cancelled: 'Admin: Order cancelled',
  };

  order.orderStatus = orderStatus;
  order.timeline.push({
    event: orderStatus.toUpperCase(),
    description: statusDescriptions[orderStatus] || `Admin updated status to ${orderStatus}`,
    timestamp: new Date(),
  });

  if (orderStatus === 'cancelled') {
    order.cancelledBy = 'admin';
    if (cancellationReason) {
      order.cancellationReason = cancellationReason;
    }
    // Restore crop quantity
    await CropListing.findByIdAndUpdate(order.cropId, {
      $inc: { quantity: order.quantity }
    });
  }

  if (orderStatus === 'completed') {
    order.completedAt = new Date();
    order.paymentStatus = 'completed';
  }

  await order.save();

  // Populate for response
  await order.populate('buyerId', 'firstName lastName name phone email city state');
  await order.populate('farmerId', 'firstName lastName name phone farmName city state');
  await order.populate('cropId', 'cropName images price unit');

  // Notify both buyer and farmer
  try {
    const notifyUsers = [];
    if (order.buyerId?._id) notifyUsers.push(order.buyerId._id);
    if (order.farmerId?._id) notifyUsers.push(order.farmerId._id);

    for (const userId of notifyUsers) {
      await Notification.create({
        userId,
        title: `Order #${order.orderNumber} - Admin Update`,
        message: `Admin updated order #${order.orderNumber} to "${orderStatus}". ${statusDescriptions[orderStatus] || ''}`,
        type: 'order',
        relatedId: order._id,
        priority: 'high',
        actionUrl: `/order/${order._id}`,
        data: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          status: orderStatus,
        },
      });
    }
  } catch (notifErr) {
    console.error('Failed to create admin status notification:', notifErr);
  }

  // Log admin action
  try {
    await AuditLog.create({
      adminId: req.user._id,
      adminEmail: req.user.email,
      action: 'UPDATE_ORDER_STATUS',
      resourceType: 'order',
      resourceId: order._id,
      status: 'success',
      changes: {
        previousStatus: order.orderStatus,
        newStatus: orderStatus,
        cancellationReason: cancellationReason || null,
      },
      timestamp: new Date(),
    });
  } catch (auditErr) {
    console.error('Failed to log admin action:', auditErr);
  }

  res.status(200).json({
    success: true,
    message: 'Order status updated by admin',
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

  const crops = await CropListing.find({ farmerId: farmer._id }).lean();
  const orders = await Order.find({ 'items.farmerId': farmer._id }).lean();

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

  const orders = await Order.find({ buyerId: buyer._id }).lean();
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

// ========== DOCUMENT & IMAGE VISIBILITY FOR ADMINS ==========

/**
 * Get all documents and images for a specific user (farmer or buyer)
 * Includes: KYC documents, farm images, crop images
 */
export const getUserDocuments = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId).select(
    'firstName lastName email role kycStatus farmImages kycDocuments'
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Fetch user's crops if farmer
  let cropImages = [];
  if (user.role === 'farmer') {
    const crops = await CropListing.find({ farmerId: userId }).select('cropName images').lean();
    cropImages = crops.map(crop => ({
      cropName: crop.cropName,
      images: crop.images || []
    }));
  }

  // Format KYC documents
  const kycDocuments = [];
  if (user.kycDocuments) {
    Object.entries(user.kycDocuments).forEach(([docType, docData]) => {
      if (docData && docData.url) {
        kycDocuments.push({
          type: docType,
          fileName: docData.fileName,
          url: docData.url,
          publicId: docData.publicId,
          fileSize: docData.fileSize,
          mimeType: docData.mimeType,
          uploadedAt: docData.uploadedAt
        });
      }
    });
  }

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        kycStatus: user.kycStatus
      },
      documents: {
        kycDocuments: kycDocuments,
        farmImages: user.farmImages || [],
        cropImages: cropImages
      }
    }
  });
});

/**
 * Search and list users with documents for admin review
 * Supports filtering by role and KYC verification status
 */
export const searchDocuments = asyncHandler(async (req, res) => {
  const { role, kycStatus, page = 1, limit = 20 } = req.query;

  const query = {};
  if (role) query.role = role;
  if (kycStatus) query.kycStatus = kycStatus;

  const skip = (page - 1) * limit;

  const users = await User.find(query)
    .select('firstName lastName email role kycStatus kycSubmittedAt kycDocuments farmImages')
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ kycSubmittedAt: -1 });

  // Get document counts for each user
  const usersWithDocCounts = await Promise.all(
    users.map(async (user) => {
      let kycDocCount = 0;
      if (user.kycDocuments) {
        kycDocCount = Object.values(user.kycDocuments).filter(doc => doc && doc.url).length;
      }

      let farmImageCount = 0;
      if (user.farmImages) {
        farmImageCount = user.farmImages.length;
      }

      let cropImageCount = 0;
      if (user.role === 'farmer') {
        const cropCount = await CropListing.countDocuments({
          farmerId: user._id,
          images: { $exists: true, $ne: [] }
        });
        cropImageCount = cropCount;
      }

      return {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        kycStatus: user.kycStatus,
        kycSubmittedAt: user.kycSubmittedAt,
        documentCounts: {
          kycDocuments: kycDocCount,
          farmImages: farmImageCount,
          cropImages: cropImageCount
        }
      };
    })
  );

  const total = await User.countDocuments(query);

  res.status(200).json({
    success: true,
    users: usersWithDocCounts,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * @desc    Serve a local document with proper Content-Type headers for inline viewing
 * @route   GET /api/admin/documents/proxy
 * @access  Private/Admin
 * @param   ?url=<local_url> - The local file URL (e.g., /uploads/kyc_documents/123-file.pdf)
 * @description Reads the file from local disk and serves it with proper Content-Type
 *              and Content-Disposition: inline headers for browser preview.
 */
export const proxyDocument = asyncHandler(async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      success: false,
      message: 'URL parameter is required'
    });
  }

  // Only allow local upload URLs (security: prevent path traversal)
  if (!url.startsWith('/uploads/')) {
    return res.status(400).json({
      success: false,
      message: 'Only local upload URLs are supported'
    });
  }

  try {
    // Resolve the absolute file path from the relative URL
    const filePath = path.join(__dirname, '..', url.replace(/\//g, path.sep));

    // Security check: ensure the resolved path is within the uploads directory
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!filePath.startsWith(uploadsDir)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Determine MIME type from file extension
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.csv': 'text/csv',
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    const isPDF = ext === '.pdf';

    const fileBuffer = fs.readFileSync(filePath);

    // Set proper headers for inline viewing
    res.set({
      'Content-Type': isPDF ? 'application/pdf' : contentType,
      'Content-Disposition': 'inline',
      'Content-Length': fileBuffer.length,
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*'
    });

    res.send(fileBuffer);
  } catch (error) {
    console.error('Document proxy error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to serve document'
    });
  }
});
