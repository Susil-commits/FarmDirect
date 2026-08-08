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
import { UserRole, UserStatus, KycStatus, OrderStatus, CancelledBy, PaymentStatus, CropStatus, CropAvailability } from '../types/enums.js';
import type { Request, Response } from 'express';
import type { Types, PipelineStage } from 'mongoose';
import { AdminService } from '../services/adminService.js';

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

interface CommunityStatsData {
  users: { farmers: number; buyers: number };
  crops: { total: number };
  orders: { total: number };
}

// B15 FIX: Type the cache entry properly instead of using `any`
let cachedCommunityStats: { data: CommunityStatsData; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

export const getPublicCommunityStats = asyncHandler(async (_req: Request, res: Response) => {
  try {
    const now = Date.now();
    if (cachedCommunityStats && now - cachedCommunityStats.timestamp < CACHE_TTL) {
      res.status(200).json({
        success: true,
        data: cachedCommunityStats.data,
      });
      return;
    }

    const [totalFarmers, totalBuyers, totalCrops, totalOrders] = await Promise.all([
      User.countDocuments({ role: UserRole.Farmer, status: UserStatus.Active }),
      User.countDocuments({ role: UserRole.Buyer, status: UserStatus.Active }),
      CropListing.countDocuments({ status: 'active' }),
      Order.countDocuments({ orderStatus: { $in: [OrderStatus.Completed] } }),
    ]);
    
    const data = {
      users: { farmers: totalFarmers || 0, buyers: totalBuyers || 0 },
      crops: { total: totalCrops || 0 },
      orders: { total: totalOrders || 0 },
    };

    cachedCommunityStats = { data, timestamp: now };

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching community stats:', error);
    if (cachedCommunityStats) {
      res.status(200).json({
        success: true,
        data: cachedCommunityStats.data,
        cached: true,
      });
      return;
    }
    throw error;
  }
});

export const getDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
  const data = await AdminService.getDashboardStats();
  res.status(200).json({ success: true, data });
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

  try {
    const user = await AdminService.toggleUserStatus(
      userId, status, reason, adminUser._id, adminUser.email, 
      req.ip || 'Unknown', req.get('user-agent') || 'Unknown'
    );
    res.status(200).json({ success: true, message: `User ${status === UserStatus.Active ? 'reactivated' : status} successfully`, data: user });
  } catch (err: any) {
    if (err.message === 'Invalid status' || err.message === 'User not found') {
      sendError(res, err.message, err.message === 'User not found' ? 404 : 400);
    } else {
      throw err;
    }
  }
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { reason } = req.body as { reason?: string };
  const adminUser = req.user as AdminUser;

  try {
    const userName = await AdminService.deleteUser(
      userId, reason, adminUser._id, adminUser.email,
      req.ip || 'Unknown', req.get('user-agent') || 'Unknown'
    );
    res.status(200).json({ success: true, message: `User ${userName} and all associated data have been deleted successfully` });
  } catch (err: any) {
    if (err.message === 'User not found') {
      sendError(res, err.message, 404);
    } else {
      throw err;
    }
  }
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

  // B7 FIX: A rejection reason must be meaningful — an empty string gives the
  // user nothing actionable to fix. Require at least 10 characters.
  if (!reason || reason.trim().length < 10) {
    return sendError(res, 'A rejection reason of at least 10 characters is required', 400);
  }

  const user = await User.findByIdAndUpdate(userId, { kycStatus: KycStatus.Rejected, kycRejectionReason: reason.trim(), kycResultSeen: false }, { new: true }).select('-password');
  if (!user) return sendError(res, 'User not found', 404);

  try {
    await Notification.create({ userId, title: 'KYC Rejected', message: `Your KYC application has been rejected. Reason: ${reason.trim()}. You can re-submit your documents for verification.`, type: 'general', priority: 'high' });
  } catch (err) { console.error('Notification creation error:', err); }

  notifyKYCUpdate(userId, 'rejected', reason.trim());

  try {
    await AuditLog.create({ adminId: adminUser._id, adminEmail: adminUser.email, action: 'KYC_REJECTED', resourceType: 'KYC', resourceId: userId, resourceDetails: `${user.firstName} ${user.lastName} (${user.email})`, reason: reason.trim(), ipAddress: req.ip, userAgent: req.get('user-agent') || 'Unknown', status: 'success' });
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
  // B10 FIX: ObjectId fields cannot use $regex — search on orderNumber (string) instead
  if (search) query.orderNumber = { $regex: search, $options: 'i' };
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

    // B9 FIX: Only restore availability/status if the crop was previously
    const cropForRestore = await CropListing.findById(order.cropId).select('status').lean();
    const wasListingActive = cropForRestore?.status === CropStatus.Active || cropForRestore?.status === CropStatus.SoldOut;
    const restoreSet: Record<string, unknown> = { $inc: { quantity: order.quantity, sold: -order.quantity } };
    if (wasListingActive) {
      (restoreSet as Record<string, unknown>)['$set'] = { availability: CropAvailability.Available, status: CropStatus.Active };
    }
    await CropListing.findByIdAndUpdate(order.cropId, restoreSet);
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

  // B10 FIX: Replace the N+1 per-user CropListing.find inside Promise.all with
  const pipeline: PipelineStage[] = [
    { $match: { ...query } } as PipelineStage,
    { $sort: { createdAt: -1 } } as PipelineStage,
    { $skip: skip } as PipelineStage,
    { $limit: Number(limit) } as PipelineStage,
    { $project: { password: 0 } } as PipelineStage,
    {
      $lookup: {
        from: 'croplistings',
        let: { uid: '$_id', role: '$role' },
        pipeline: [
          { $match: { $expr: { $and: [{ $eq: ['$$role', UserRole.Farmer] }, { $eq: ['$farmerId', '$$uid'] }] } } },
          { $project: { cropName: 1, category: 1, price: 1, quantity: 1, images: 1, description: 1, status: 1 } },
        ] as PipelineStage[],
        as: 'crops',
      },
    } as PipelineStage,
  ];

  const [usersWithCrops, totalResult] = await Promise.all([
    User.aggregate(pipeline),
    User.countDocuments(query),
  ]);

  paginated(res, usersWithCrops, totalResult, Number(page), Number(limit));
});

export const getDashboardAnalytics = asyncHandler(async (_req: Request, res: Response) => {
  const analytics = await AdminService.getDashboardAnalytics();
  res.status(200).json({ success: true, analytics });
});

export const getFarmerAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const farmer = await User.findById(req.params.farmerId);
  if (!farmer || farmer.role !== UserRole.Farmer) return sendError(res, 'Farmer not found', 404);
  const [crops, orders] = await Promise.all([CropListing.find({ farmerId: farmer._id }).lean(), Order.find({ farmerId: farmer._id }).lean()]);
  const totalEarnings = orders.filter((o) => o.orderStatus === OrderStatus.Completed).reduce((sum, o) => sum + o.totalAmount, 0);
  res.status(200).json({ success: true, farmer: { _id: farmer._id, name: farmer.name, email: farmer.email }, analytics: { crops: crops.length, orders: orders.length, deliveredOrders: orders.filter((o) => o.orderStatus === OrderStatus.Completed).length, totalEarnings, rating: farmer.rating, kycStatus: farmer.kycStatus }, recentOrders: orders.slice(-10) });
});

export const getBuyerAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const buyer = await User.findById(req.params.buyerId);
  if (!buyer || buyer.role !== UserRole.Buyer) return sendError(res, 'Buyer not found', 404);
  const orders = await Order.find({ buyerId: buyer._id }).lean();
  const totalSpent = orders.filter((o) => o.orderStatus === OrderStatus.Completed).reduce((sum, o) => sum + o.totalAmount, 0);
  res.status(200).json({ success: true, buyer: { _id: buyer._id, name: buyer.name, email: buyer.email }, analytics: { orders: orders.length, completedOrders: orders.filter((o) => o.orderStatus === OrderStatus.Completed).length, totalSpent, rating: buyer.rating }, recentOrders: orders.slice(-10) });
});

export async function logAdminAction(adminId: Types.ObjectId, action: string, resourceType: string, resourceId: Types.ObjectId, changes: Record<string, unknown> = {}, reason = ''): Promise<void> {
  try {
    const admin = await User.findById(adminId);
    await AuditLog.create({ adminId, adminEmail: admin?.email || 'unknown', action, resourceType, resourceId, changes, reason, status: 'success', timestamp: new Date() });
    await invalidationStrategies.adminAction();
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
  await invalidationStrategies.userChanged(String(user._id));
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

  const uploadsDir = path.resolve(__dirname, '..', 'uploads');
  const filePath = path.resolve(uploadsDir, url.replace(/^\/uploads\//, ''));
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

  // B8 FIX: Use res.sendFile (streaming) instead of readFileSync + res.send.
  res.set({
    'Content-Type': contentType,
    'Content-Disposition': 'inline',
    'Cache-Control': 'public, max-age=3600',
    'Access-Control-Allow-Origin': '*',
  });
  res.sendFile(filePath, (err) => {
    if (err && !res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to stream file' });
    }
  });
});

export const getFlaggedOrders = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 20;

  const query = { flaggedAsAnomaly: true };
  const total = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .sort({ anomalyScore: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('buyerId', 'firstName lastName email phone')
    .populate('farmerId', 'firstName lastName email farmName phone')
    .lean();

  paginated(res, orders, total, page, limit);
});
