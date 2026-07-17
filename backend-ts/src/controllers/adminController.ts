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
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendError } from '../utils/apiResponse.js';
import { invalidationStrategies } from '../utils/cache.js';
import { notifyKYCUpdate, notifyUserStatusChange } from '../socket/eventHandlers.js';
import { UserRole, UserStatus, KycStatus, OrderStatus, CancelledBy, PaymentStatus } from '../types/enums.js';
import type { Request, Response } from 'express';
import type { Types } from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface AdminUser {
  _id: Types.ObjectId;
  email: string;
}

const PENDING_STATUSES = [OrderStatus.Confirmed, OrderStatus.Preparing, OrderStatus.ReadyForPickup, OrderStatus.PickedUp];

function buildQuery(req: Request): Record<string, unknown> {
  const { role, search, status } = req.query as Record<string, string>;
  const query: Record<string, unknown> = {};
  if (role) query.role = role;
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { farmName: { $regex: search, $options: 'i' } },
    ];
  }
  return query;
}

function paginated(res: Response, data: unknown, total: number, page: number, limit: number): void {
  res.status(200).json({
    success: true, data,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export const getPublicCommunityStats = asyncHandler(async (_req: Request, res: Response) => {
  const [totalFarmers, totalBuyers, totalCrops, totalOrders] = await Promise.all([
    User.countDocuments({ role: UserRole.Farmer, status: UserStatus.Active }),
    User.countDocuments({ role: UserRole.Buyer, status: UserStatus.Active }),
    CropListing.countDocuments({ status: 'active' }),
    Order.countDocuments({ orderStatus: { $in: [OrderStatus.Completed] } }),
  ]);
  res.status(200).json({
    success: true,
    data: {
      users: { farmers: totalFarmers || 0, buyers: totalBuyers || 0 },
      crops: { total: totalCrops || 0 },
      orders: { total: totalOrders || 0 },
    },
  });
});

export const getDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
  const [totalUsers, totalBuyers, totalFarmers, totalAdmins, totalCrops, activeCrops, totalOrders, pendingOrders, completedOrders, totalReviews, pendingKYC] = await Promise.all([
    User.countDocuments({}),                                                        // ALL users (fixed: was only KYC-verified)
    User.countDocuments({ role: UserRole.Buyer }),
    User.countDocuments({ role: UserRole.Farmer }),
    User.countDocuments({ role: UserRole.Admin }),
    CropListing.countDocuments(),
    CropListing.countDocuments({ status: 'active' }),
    Order.countDocuments(),
    Order.countDocuments({ orderStatus: { $in: PENDING_STATUSES } }),
    Order.countDocuments({ orderStatus: OrderStatus.Completed }),
    Review.countDocuments(),
    User.countDocuments({ kycStatus: KycStatus.Pending }),
  ]);

  const revenueResult = await Order.aggregate([
    { $match: { orderStatus: OrderStatus.Completed } },
    { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
  ]);
  const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

  res.status(200).json({
    success: true,
    data: {
      users: { total: totalUsers, buyers: totalBuyers, farmers: totalFarmers, admins: totalAdmins },
      crops: { total: totalCrops, active: activeCrops, inactive: totalCrops - activeCrops },
      orders: { total: totalOrders, pending: pendingOrders, completed: completedOrders, totalRevenue },
      reviews: totalReviews, pendingKYC,
    },
  });
});

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20' } = req.query as Record<string, string>;
  const query = buildQuery(req);
  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(query).select('-password').skip(skip).limit(Number(limit)).sort({ createdAt: -1 }).lean(),
    User.countDocuments(query),
  ]);
  paginated(res, users, total, Number(page), Number(limit));
});

export const toggleUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { status, reason } = req.body as { status: UserStatus; reason?: string };
  const adminUser = req.user as AdminUser;

  if (![UserStatus.Active, UserStatus.Suspended, UserStatus.Banned].includes(status)) {
    return sendError(res, 'Invalid status', 400);
  }

  const previousUser = await User.findById(userId).select('-password');
  if (!previousUser) return sendError(res, 'User not found', 404);

  const user = await User.findByIdAndUpdate(
    userId,
    { status, suspensionReason: status !== UserStatus.Active ? reason : '', updatedAt: new Date() },
    { new: true },
  ).select('-password');

  let notifTitle: string, notifMessage: string, auditAction: string;
  if (status === UserStatus.Suspended) {
    notifTitle = 'Account Suspended'; notifMessage = `Your account has been suspended. Reason: ${reason || 'Violation of platform terms'}.`;
    auditAction = 'USER_SUSPENDED';
  } else if (status === UserStatus.Banned) {
    notifTitle = 'Account Banned'; notifMessage = `Your account has been permanently banned. Reason: ${reason || 'Severe violation of platform terms'}.`;
    auditAction = 'USER_BANNED';
  } else {
    notifTitle = 'Account Reactivated'; notifMessage = 'Your account has been reactivated. Welcome back!';
    auditAction = 'USER_UPDATED';
  }

  try {
    await Notification.create({ userId, title: notifTitle, message: notifMessage, type: 'general', priority: 'high' });
  } catch (err) { console.error('Notification creation error:', err); }

  notifyUserStatusChange(userId, status, reason);

  try {
    await AuditLog.create({
      adminId: adminUser._id, adminEmail: adminUser.email, action: auditAction, resourceType: 'User',
      resourceId: userId, resourceDetails: `${previousUser.firstName} ${previousUser.lastName} (${previousUser.email})`,
      changes: { before: { status: previousUser.status }, after: { status: user!.status } },
      reason: status !== UserStatus.Active ? reason : 'Account reactivated by admin',
      ipAddress: req.ip, userAgent: req.get('user-agent') || 'Unknown', status: 'success',
    });
  } catch (auditErr) { console.error('Audit log creation error:', auditErr); }

  res.status(200).json({ success: true, message: `User ${status === UserStatus.Active ? 'reactivated' : status} successfully`, data: user });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { reason } = req.body as { reason?: string };
  const adminUser = req.user as AdminUser;

  const user = await User.findById(userId);
  if (!user) return sendError(res, 'User not found', 404);

  const userName = `${user.firstName} ${user.lastName}`;
  const userEmail = user.email;
  const userRole = user.role;

  try {
    await Notification.create({
      userId, title: 'Account Deleted', message: `Your account has been permanently deleted. Reason: ${reason || 'Violation of platform terms'}.`,
      type: 'general', priority: 'high',
    });
  } catch (notifErr) { console.error('Deletion notification error:', notifErr); }

  if (userRole === UserRole.Farmer) await CropListing.deleteMany({ farmerId: userId });
  await Order.deleteMany({ $or: [{ buyerId: userId }, { farmerId: userId }] });
  await Review.deleteMany({ $or: [{ reviewerId: userId }, { revieweeId: userId }] });
  await Wishlist.deleteMany({ userId });
  await Notification.deleteMany({ userId });
  await User.findByIdAndDelete(userId);

  try {
    await AuditLog.create({
      adminId: adminUser._id, adminEmail: adminUser.email, action: 'USER_DELETED', resourceType: 'User',
      resourceId: userId, resourceDetails: `${userName} (${userEmail})`, reason: reason || 'Deleted by admin',
      ipAddress: req.ip, userAgent: req.get('user-agent') || 'Unknown', status: 'success',
    });
  } catch (auditErr) { console.error('Audit log error:', auditErr); }

  res.status(200).json({ success: true, message: `User ${userName} and all associated data have been deleted successfully` });
});

export const approveUserKYC = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { comments } = req.body as { comments?: string };
  const adminUser = req.user as AdminUser;

  const user = await User.findByIdAndUpdate(
    userId,
    { kycStatus: KycStatus.Verified, kycVerifiedAt: new Date(), kycComments: comments, status: UserStatus.Active, kycResultSeen: false },
    { new: true },
  ).select('-password');

  if (!user) return sendError(res, 'User not found', 404);

  const roleMessage = user.role === UserRole.Farmer
    ? 'You can now list your crops on the marketplace and start selling!'
    : 'You can now browse the marketplace and place orders!';
  try {
    await Notification.create({ userId, title: 'KYC Approved', message: `Congratulations! Your KYC has been approved. ${roleMessage} ${comments ? `Admin notes: ${comments}` : ''}`, type: 'general', priority: 'high' });
  } catch (err) { console.error('Notification creation error:', err); }

  notifyKYCUpdate(userId, 'verified', undefined);

  try {
    await AuditLog.create({ adminId: adminUser._id, adminEmail: adminUser.email, action: 'KYC_APPROVED', resourceType: 'KYC', resourceId: userId, resourceDetails: `${user.firstName} ${user.lastName} (${user.email})`, reason: comments || 'KYC documents verified', ipAddress: req.ip, userAgent: req.get('user-agent') || 'Unknown', status: 'success' });
  } catch (auditErr) { console.error('Audit log error:', auditErr); }

  res.status(200).json({ success: true, message: 'User KYC approved', data: user });
});

export const rejectUserKYC = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { reason } = req.body as { reason: string };
  const adminUser = req.user as AdminUser;

  const user = await User.findByIdAndUpdate(userId, { kycStatus: KycStatus.Rejected, kycRejectionReason: reason, kycResultSeen: false }, { new: true }).select('-password');
  if (!user) return sendError(res, 'User not found', 404);

  try {
    await Notification.create({ userId, title: 'KYC Rejected', message: `Your KYC application has been rejected. Reason: ${reason}. You can re-submit your documents for verification.`, type: 'general', priority: 'high' });
  } catch (err) { console.error('Notification creation error:', err); }

  notifyKYCUpdate(userId, 'rejected', reason);

  try {
    await AuditLog.create({ adminId: adminUser._id, adminEmail: adminUser.email, action: 'KYC_REJECTED', resourceType: 'KYC', resourceId: userId, resourceDetails: `${user.firstName} ${user.lastName} (${user.email})`, reason: reason || 'KYC documents rejected', ipAddress: req.ip, userAgent: req.get('user-agent') || 'Unknown', status: 'success' });
  } catch (auditErr) { console.error('Audit log error:', auditErr); }

  res.status(200).json({ success: true, message: 'User KYC rejected', data: user });
});

export const markKYCResultSeen = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findByIdAndUpdate(req.user!._id, { kycResultSeen: true }, { new: true }).select('-password');
  res.status(200).json({ success: true, message: 'KYC result marked as seen', data: user });
});

export const debugGetAllUsersKYCStatus = asyncHandler(async (_req: Request, res: Response) => {
  const users = await User.find({}).select('firstName lastName email role kycStatus status createdAt').sort({ createdAt: -1 });
  res.status(200).json({ success: true, debug: true, users });
});

export const getPendingKYC = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', role = 'farmer' } = req.query as Record<string, string>;
  const queryRole = (role.toLowerCase().replace(/s$/, '') as UserRole) || UserRole.Farmer;
  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find({ role: queryRole, kycStatus: KycStatus.Pending }).select('-password').skip(skip).limit(Number(limit)).sort({ createdAt: -1 }).lean(),
    User.countDocuments({ role: queryRole, kycStatus: KycStatus.Pending }),
  ]);
  paginated(res, users, total, Number(page), Number(limit));
});

export const getRejectedKYC = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', role = 'buyer' } = req.query as Record<string, string>;
  const queryRole = (role.toLowerCase().replace(/s$/, '') as UserRole) || UserRole.Buyer;
  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find({ role: queryRole, kycStatus: KycStatus.Rejected }).select('-password').skip(skip).limit(Number(limit)).sort({ createdAt: -1 }).lean(),
    User.countDocuments({ role: queryRole, kycStatus: KycStatus.Rejected }),
  ]);
  paginated(res, users, total, Number(page), Number(limit));
});

export const getAllCrops = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', status, search } = req.query as Record<string, string>;
  const skip = (Number(page) - 1) * Number(limit);
  const query: Record<string, unknown> = {};
  if (status) query.status = status;
  if (search) query.$or = [{ cropName: { $regex: search, $options: 'i' } }, { category: { $regex: search, $options: 'i' } }];
  const [crops, total] = await Promise.all([
    CropListing.find(query).populate('farmerId', 'firstName lastName farmName').skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
    CropListing.countDocuments(query),
  ]);
  paginated(res, crops, total, Number(page), Number(limit));
});

export const approveCrop = asyncHandler(async (req: Request, res: Response) => {
  const crop = await CropListing.findByIdAndUpdate(req.params.cropId, { listingApprovalStatus: 'approved', updatedAt: new Date() }, { new: true }).populate('farmerId', 'name email');
  if (!crop) return sendError(res, 'Crop not found', 404);
  try {
    await Notification.create({ userId: crop.farmerId, title: 'Crop Approved', message: `Your crop listing "${crop.cropName}" has been approved and is now visible to buyers!`, type: 'general', priority: 'high', data: { cropId: crop._id, cropName: crop.cropName } });
  } catch (err) { console.error('Notification creation error:', err); }
  res.status(200).json({ success: true, message: 'Crop approved successfully', data: crop });
});

export const rejectCrop = asyncHandler(async (req: Request, res: Response) => {
  const { reason } = req.body as { reason?: string };
  const crop = await CropListing.findByIdAndUpdate(req.params.cropId, { listingApprovalStatus: 'rejected', rejectionReason: reason }, { new: true }).populate('farmerId', 'name email');
  if (!crop) return sendError(res, 'Crop not found', 404);
  try {
    await Notification.create({ userId: crop.farmerId, title: 'Crop Rejected', message: `Your crop listing "${crop.cropName}" has been rejected. Reason: ${reason || 'Not specified'}.`, type: 'general', priority: 'high', data: { cropId: crop._id, cropName: crop.cropName, rejectionReason: reason } });
  } catch (err) { console.error('Notification creation error:', err); }
  res.status(200).json({ success: true, message: 'Crop rejected', data: crop });
});

export const freezeCrop = asyncHandler(async (req: Request, res: Response) => {
  const { reason } = req.body as { reason?: string };
  const crop = await CropListing.findByIdAndUpdate(req.params.cropId, { status: 'inactive' }, { new: true });
  if (!crop) return sendError(res, 'Crop not found', 404);
  try {
    await Notification.create({ userId: crop.farmerId, title: 'Crop Suspended', message: `Your crop "${crop.cropName}" has been suspended. Reason: ${reason}`, type: 'general', relatedId: String(crop._id), priority: 'high' });
  } catch (err) { console.error('Notification creation error:', err); }
  res.status(200).json({ success: true, message: 'Crop frozen successfully', data: crop });
});

export const deleteCrop = asyncHandler(async (req: Request, res: Response) => {
  const { reason } = req.body as { reason?: string };
  const crop = await CropListing.findById(req.params.cropId);
  if (!crop) return sendError(res, 'Crop not found', 404);
  const cropName = crop.cropName;
  const farmerId = crop.farmerId;
  await CropListing.findByIdAndDelete(req.params.cropId);
  try {
    await Notification.create({ userId: farmerId, title: 'Crop Deleted', message: `Your crop "${cropName}" has been deleted from marketplace. Reason: ${reason}`, type: 'general', priority: 'high' });
  } catch (err) { console.error('Notification creation error:', err); }
  res.status(200).json({ success: true, message: 'Crop deleted successfully', data: { id: req.params.cropId } });
});

export const getAllOrders = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', status, search } = req.query as Record<string, string>;
  const skip = (Number(page) - 1) * Number(limit);
  const query: Record<string, unknown> = {};
  if (status) query.orderStatus = status;
  if (search) query._id = { $regex: search, $options: 'i' };
  const [orders, total] = await Promise.all([
    Order.find(query).populate('buyerId', 'firstName lastName email phone city state').populate('farmerId', 'firstName lastName name farmName phone city state').populate('cropId', 'cropName images price unit').skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
    Order.countDocuments(query),
  ]);
  paginated(res, orders, total, Number(page), Number(limit));
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { orderStatus, cancellationReason } = req.body as { orderStatus: OrderStatus; cancellationReason?: string };
  const adminUser = req.user as AdminUser;

  const validStatuses: OrderStatus[] = [OrderStatus.Confirmed, OrderStatus.Preparing, OrderStatus.ReadyForPickup, OrderStatus.PickedUp, OrderStatus.Completed, OrderStatus.Cancelled];
  if (!validStatuses.includes(orderStatus)) { sendError(res, `Invalid order status. Must be one of: ${validStatuses.join(', ')}`, 400); return; }

  const order = await Order.findById(orderId);
  if (!order) { sendError(res, 'Order not found', 404); return; }

  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.Confirmed]: [OrderStatus.Preparing, OrderStatus.Cancelled],
    [OrderStatus.Preparing]: [OrderStatus.ReadyForPickup, OrderStatus.Cancelled],
    [OrderStatus.ReadyForPickup]: [OrderStatus.PickedUp, OrderStatus.Cancelled],
    [OrderStatus.PickedUp]: [OrderStatus.Completed],
    [OrderStatus.Completed]: [],
    [OrderStatus.Cancelled]: [],
  };
  if (!validTransitions[order.orderStatus]?.includes(orderStatus)) { sendError(res, `Cannot transition from "${order.orderStatus}" to "${orderStatus}"`, 400); return; }

  const previousStatus = order.orderStatus;

  order.orderStatus = orderStatus;
  order.timeline.push({ event: orderStatus.toUpperCase(), description: `Admin updated status to ${orderStatus}`, timestamp: new Date() });

  if (orderStatus === OrderStatus.Cancelled) {
    order.cancelledBy = CancelledBy.Admin;
    if (cancellationReason) order.cancellationReason = cancellationReason;
    await CropListing.findByIdAndUpdate(order.cropId, { $inc: { quantity: order.quantity, sold: -order.quantity }, availability: 'available', status: 'active' });
  }

  if (orderStatus === OrderStatus.Completed) {
    order.completedAt = new Date();
    order.paymentStatus = PaymentStatus.Completed;

    const crop = await CropListing.findById(order.cropId);
    if (crop) {
      const updateFields: Record<string, unknown> = {};
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (crop.quantity <= 0) {
        updateFields.status = 'soldOut';
        updateFields.availability = 'not_available';
      }
      const todaySalesEntry = (crop.dailySales || []).find((ds) => new Date(ds.date).toDateString() === today.toDateString());
      if (todaySalesEntry) {
        await CropListing.findByIdAndUpdate(order.cropId, {
          ...updateFields,
          $inc: {
            'dailySales.$[elem].quantity': order.quantity,
            'dailySales.$[elem].revenue': order.totalAmount,
            'monthlyStats.totalRevenue': order.totalAmount,
            'monthlyStats.totalUnits': order.quantity,
          },
        }, { arrayFilters: [{ 'elem.date': { $gte: today, $lt: new Date(today.getTime() + 86400000) } }] });
      } else {
        await CropListing.findByIdAndUpdate(order.cropId, {
          ...updateFields,
          $push: { dailySales: { date: today, quantity: order.quantity, revenue: order.totalAmount } },
          $inc: { 'monthlyStats.totalRevenue': order.totalAmount, 'monthlyStats.totalUnits': order.quantity },
        });
      }
    }
  }

  await order.save();
  await order.populate('buyerId', 'firstName lastName name phone email city state');
  await order.populate('farmerId', 'firstName lastName name phone farmName city state');
  await order.populate('cropId', 'cropName images price unit');

  // Notify both buyer and farmer
  try {
    const notifyUsers: Types.ObjectId[] = [];
    if (order.buyerId) notifyUsers.push(order.buyerId as Types.ObjectId);
    if (order.farmerId) notifyUsers.push(order.farmerId as Types.ObjectId);
    for (const userId of notifyUsers) {
      await Notification.create({
        userId, title: `Order #${order.orderNumber} - Admin Update`,
        message: `Admin updated order #${order.orderNumber} to "${orderStatus}".`,
        type: 'order', relatedId: String(order._id), priority: 'high', actionUrl: `/order/${order._id}`,
        data: { orderId: order._id, orderNumber: order.orderNumber, status: orderStatus },
      });
    }
  } catch (notifErr) { console.error('Failed to create admin status notification:', notifErr); }

  try {
    await AuditLog.create({ adminId: adminUser._id, adminEmail: adminUser.email, action: 'ORDER_STATUS_CHANGED', resourceType: 'Order', resourceId: order._id, status: 'success', changes: { previousStatus, newStatus: orderStatus, cancellationReason: cancellationReason || null }, timestamp: new Date() });
  } catch (auditErr) { console.error('Failed to log admin action:', auditErr); }

  res.status(200).json({ success: true, message: 'Order status updated by admin', data: order });
});

export const sendAnnouncement = asyncHandler(async (_req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Announcement broadcast is not yet implemented' });
});

export const getSystemLogs = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '50' } = req.query as Record<string, string>;
  res.status(501).json({ success: false, message: 'System logs are not yet implemented', data: [], pagination: { page: Number(page), limit: Number(limit), total: 0 } });
});

export const getUsersWithCrops = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20' } = req.query as Record<string, string>;
  const query = buildQuery(req);
  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(query).select('-password').skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
    User.countDocuments(query),
  ]);
  const usersWithCrops = await Promise.all(users.map(async (user) => {
    const userObj = user.toObject() as unknown as Record<string, unknown>;
    if (user.role === UserRole.Farmer) {
      userObj.crops = await CropListing.find({ farmerId: user._id }).select('cropName category price quantity images description status');
    } else { userObj.crops = []; }
    return userObj;
  }));
  paginated(res, usersWithCrops, total, Number(page), Number(limit));
});

export const getDashboardAnalytics = asyncHandler(async (_req: Request, res: Response) => {
  const [totalUsers, totalFarmers, totalBuyers, pendingKYC, totalCrops, approvedCrops, pendingCrops, totalOrders, completedOrders, pendingOrders] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: UserRole.Farmer }),
    User.countDocuments({ role: UserRole.Buyer }),
    User.countDocuments({ kycStatus: KycStatus.Pending, role: UserRole.Farmer }),
    CropListing.countDocuments(), CropListing.countDocuments({ listingApprovalStatus: 'approved' }), CropListing.countDocuments({ listingApprovalStatus: 'pending' }),
    Order.countDocuments(), Order.countDocuments({ orderStatus: OrderStatus.Completed }), Order.countDocuments({ orderStatus: { $in: PENDING_STATUSES } }),
  ]);
  // Use aggregate instead of find().select('totalAmount') to avoid OOM on large datasets
  const [revenueResult] = await Order.aggregate([{ $group: { _id: null, total: { $sum: '$totalAmount' } } }]);
  const totalRevenue = revenueResult?.total || 0;
  res.status(200).json({ success: true, analytics: { users: { total: totalUsers, farmers: totalFarmers, buyers: totalBuyers, pendingKYC }, crops: { total: totalCrops, approved: approvedCrops, pending: pendingCrops }, orders: { total: totalOrders, completed: completedOrders, pending: pendingOrders }, revenue: totalRevenue } });
});

export const getFarmerAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const farmer = await User.findById(req.params.farmerId);
  if (!farmer || farmer.role !== UserRole.Farmer) return sendError(res, 'Farmer not found', 404);
  const [crops, orders] = await Promise.all([CropListing.find({ farmerId: farmer._id }).lean(), Order.find({ farmerId: farmer._id }).lean()]);
  const totalEarnings = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  res.status(200).json({ success: true, farmer: { _id: farmer._id, name: farmer.name, email: farmer.email }, analytics: { crops: crops.length, orders: orders.length, deliveredOrders: orders.filter((o) => o.orderStatus === OrderStatus.Completed).length, totalEarnings, rating: farmer.rating, kycStatus: farmer.kycStatus }, recentOrders: orders.slice(-10) });
});

export const getBuyerAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const buyer = await User.findById(req.params.buyerId);
  if (!buyer || buyer.role !== UserRole.Buyer) return sendError(res, 'Buyer not found', 404);
  const orders = await Order.find({ buyerId: buyer._id }).lean();
  const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  res.status(200).json({ success: true, buyer: { _id: buyer._id, name: buyer.name, email: buyer.email }, analytics: { orders: orders.length, completedOrders: orders.filter((o) => o.orderStatus === OrderStatus.Completed).length, totalSpent, rating: buyer.rating }, recentOrders: orders.slice(-10) });
});

export async function logAdminAction(adminId: Types.ObjectId, action: string, resourceType: string, resourceId: Types.ObjectId, changes: Record<string, unknown> = {}, reason = ''): Promise<void> {
  try {
    const admin = await User.findById(adminId);
    await AuditLog.create({ adminId, adminEmail: admin?.email || 'unknown', action, resourceType, resourceId, changes, reason, status: 'success', timestamp: new Date() });
    invalidationStrategies.adminAction();
  } catch (err) { console.error('Audit log error:', err); }
}

export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const { action, adminId, page = '1', limit = '50' } = req.query as Record<string, string>;
  const query: Record<string, unknown> = {};
  if (action && action !== 'all') query.action = action;
  if (adminId) query.adminId = adminId;
  const skip = (Number(page) - 1) * Number(limit);
  const [logs, total] = await Promise.all([
    AuditLog.find(query).populate('adminId', 'name email').skip(skip).limit(Number(limit)).sort({ timestamp: -1 }),
    AuditLog.countDocuments(query),
  ]);
  res.status(200).json({ success: true, logs, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
});

export const changeUserRole = asyncHandler(async (req: Request, res: Response) => {
  const { newRole } = req.body as { newRole: UserRole };
  if (![UserRole.Farmer, UserRole.Buyer, UserRole.Admin].includes(newRole)) return sendError(res, 'Invalid role', 400);
  const user = await User.findById(req.params.userId);
  if (!user) return sendError(res, 'User not found', 404);
  const oldRole = user.role;
  user.role = newRole;
  await user.save();
  await logAdminAction((req.user as AdminUser)._id, 'USER_ROLE_CHANGED', 'User', user._id, { before: { role: oldRole }, after: { role: newRole } });
  invalidationStrategies.userChanged(String(user._id));
  res.status(200).json({ success: true, message: 'User role updated successfully', user });
});

export const getApprovedFarmers = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', search } = req.query as Record<string, string>;
  const query: Record<string, unknown> = { role: UserRole.Farmer, kycStatus: KycStatus.Verified, status: UserStatus.Active };
  if (search) query.$or = [{ firstName: { $regex: search, $options: 'i' } }, { lastName: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }, { farmName: { $regex: search, $options: 'i' } }];
  const skip = (Number(page) - 1) * Number(limit);
  const [farmers, total] = await Promise.all([
    User.find(query).select('-password').skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
    User.countDocuments(query),
  ]);
  paginated(res, farmers, total, Number(page), Number(limit));
});

export const getApprovedBuyers = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', search } = req.query as Record<string, string>;
  const query: Record<string, unknown> = { role: UserRole.Buyer, kycStatus: KycStatus.Verified, status: UserStatus.Active };
  if (search) query.$or = [{ firstName: { $regex: search, $options: 'i' } }, { lastName: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
  const skip = (Number(page) - 1) * Number(limit);
  const [buyers, total] = await Promise.all([
    User.find(query).select('-password').skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
    User.countDocuments(query),
  ]);
  paginated(res, buyers, total, Number(page), Number(limit));
});

export const getSuspendedUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', search } = req.query as Record<string, string>;
  const query: Record<string, unknown> = { status: { $in: [UserStatus.Suspended, UserStatus.Banned] } };
  if (search) query.$or = [{ firstName: { $regex: search, $options: 'i' } }, { lastName: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(query).select('-password').skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
    User.countDocuments(query),
  ]);
  paginated(res, users, total, Number(page), Number(limit));
});

export const getUserDocuments = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const user = await User.findById(userId).select('firstName lastName email role kycStatus farmImages kycDocuments');
  if (!user) return sendError(res, 'User not found', 404);

  let cropImages: { cropName: string; images: string[] }[] = [];
  if (user.role === UserRole.Farmer) {
    const crops = await CropListing.find({ farmerId: userId }).select('cropName images').lean();
    cropImages = crops.map((crop) => ({ cropName: crop.cropName, images: crop.images || [] }));
  }

  const kycDocuments: { type: string; fileName?: string; url?: string; publicId?: string; fileSize?: number; mimeType?: string; uploadedAt?: Date }[] = [];
  if (user.kycDocuments) {
    Object.entries(user.kycDocuments).forEach(([docType, docData]) => {
      const d = docData as Record<string, unknown>;
      if (d && d.url) kycDocuments.push({ type: docType, fileName: d.fileName as string, url: d.url as string, publicId: d.publicId as string, fileSize: d.fileSize as number, mimeType: d.mimeType as string, uploadedAt: d.uploadedAt as Date });
    });
  }

  res.status(200).json({ success: true, data: { user: { id: user._id, name: `${user.firstName} ${user.lastName}`, email: user.email, role: user.role, kycStatus: user.kycStatus }, documents: { kycDocuments, farmImages: user.farmImages || [], cropImages } } });
});

export const searchDocuments = asyncHandler(async (req: Request, res: Response) => {
  const { role, kycStatus, page = '1', limit = '20' } = req.query as Record<string, string>;
  const query: Record<string, unknown> = {};
  if (role) query.role = role;
  if (kycStatus) query.kycStatus = kycStatus;
  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(query).select('firstName lastName email role kycStatus kycSubmittedAt kycDocuments farmImages').skip(skip).limit(Number(limit)).sort({ kycSubmittedAt: -1 }),
    User.countDocuments(query),
  ]);
  res.status(200).json({ success: true, users, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
});

export const proxyDocument = asyncHandler(async (req: Request, res: Response) => {
  const { url } = req.query as { url?: string };
  if (!url) return sendError(res, 'URL parameter is required', 400);
  if (!url.startsWith('/uploads/')) return sendError(res, 'Only local upload URLs are supported', 400);

  // Resolve both paths to prevent path traversal attacks (e.g. /uploads/../../../etc/passwd)
  const uploadsDir = path.resolve(__dirname, '..', 'uploads');
  const filePath = path.resolve(uploadsDir, url.replace(/^\/uploads\//, ''));

  // After resolution, the filePath MUST still sit inside uploadsDir
  if (!filePath.startsWith(uploadsDir + path.sep) && filePath !== uploadsDir) {
    return sendError(res, 'Access denied', 403);
  }
  if (!fs.existsSync(filePath)) return sendError(res, 'File not found', 404);

  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.pdf': 'application/pdf', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  };
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  const fileBuffer = fs.readFileSync(filePath);
  res.set({ 'Content-Type': contentType, 'Content-Disposition': 'inline', 'Content-Length': fileBuffer.length, 'Cache-Control': 'public, max-age=3600', 'Access-Control-Allow-Origin': '*' });
  res.send(fileBuffer);
});
