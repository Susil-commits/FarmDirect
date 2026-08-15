import User from '../models/User.js';
import CropListing from '../models/CropListing.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import Wishlist from '../models/Wishlist.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import { UserRole, UserStatus, KycStatus, OrderStatus } from '../types/enums.js';
import { notifyUserStatusChange } from '../socket/eventHandlers.js';
import type { Types, PipelineStage } from 'mongoose';

const PENDING_STATUSES = [OrderStatus.Confirmed, OrderStatus.Preparing, OrderStatus.ReadyForPickup, OrderStatus.PickedUp];

export class AdminService {
  
  static async getDashboardStats() {
    const [
      totalUsers, totalBuyers, totalFarmers, totalAdmins, 
      totalCrops, activeCrops, totalOrders, pendingOrders, 
      completedOrders, totalReviews, pendingKYC
    ] = await Promise.all([
      User.countDocuments({}),
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

    return {
      users: { total: totalUsers, buyers: totalBuyers, farmers: totalFarmers, admins: totalAdmins },
      crops: { total: totalCrops, active: activeCrops, inactive: totalCrops - activeCrops },
      orders: { total: totalOrders, pending: pendingOrders, completed: completedOrders, totalRevenue },
      reviews: totalReviews, 
      pendingKYC,
    };
  }

  static async getDashboardAnalytics() {
    const [totalUsers, totalFarmers, totalBuyers, pendingKYC, totalCrops, approvedCrops, pendingCrops, totalOrders, completedOrders, pendingOrders] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: UserRole.Farmer }),
      User.countDocuments({ role: UserRole.Buyer }),
      User.countDocuments({ kycStatus: KycStatus.Pending, role: UserRole.Farmer }),
      CropListing.countDocuments(), 
      CropListing.countDocuments({ listingApprovalStatus: 'approved' }), 
      CropListing.countDocuments({ listingApprovalStatus: 'pending' }),
      Order.countDocuments(), 
      Order.countDocuments({ orderStatus: OrderStatus.Completed }), 
      Order.countDocuments({ orderStatus: { $in: PENDING_STATUSES } }),
    ]);
    const [revenueResult] = await Order.aggregate([
      { $match: { orderStatus: OrderStatus.Completed } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueResult?.total || 0;
    
    return {
      users: { total: totalUsers, farmers: totalFarmers, buyers: totalBuyers, pendingKYC }, 
      crops: { total: totalCrops, approved: approvedCrops, pending: pendingCrops }, 
      orders: { total: totalOrders, completed: completedOrders, pending: pendingOrders }, 
      revenue: totalRevenue 
    };
  }

  static async toggleUserStatus(
    userId: string, 
    status: UserStatus, 
    reason: string | undefined, 
    adminId: Types.ObjectId, 
    adminEmail: string,
    ipAddress: string,
    userAgent: string
  ) {
    if (![UserStatus.Active, UserStatus.Suspended, UserStatus.Banned].includes(status)) {
      throw new Error('Invalid status');
    }

    const previousUser = await User.findById(userId).select('-password');
    if (!previousUser) throw new Error('User not found');

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
        adminId, adminEmail, action: auditAction, resourceType: 'User',
        resourceId: userId, resourceDetails: `${previousUser.firstName} ${previousUser.lastName} (${previousUser.email})`,
        changes: { before: { status: previousUser.status }, after: { status: user!.status } },
        reason: status !== UserStatus.Active ? reason : 'Account reactivated by admin',
        ipAddress, userAgent, status: 'success',
      });
    } catch (auditErr) { console.error('Audit log creation error:', auditErr); }

    return user;
  }

  static async deleteUser(
    userId: string, 
    reason: string | undefined, 
    adminId: Types.ObjectId, 
    adminEmail: string,
    ipAddress: string,
    userAgent: string
  ) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const userName = `${user.firstName} ${user.lastName}`;
    const userEmail = user.email;
    const userRole = user.role;

    try {
      await Notification.create({
        userId, title: 'Account Deleted', message: `Your account has been permanently deleted. Reason: ${reason || 'Violation of platform terms'}.`,
        type: 'general', priority: 'high',
      });
    } catch (notifErr) { console.error('Deletion notification error:', notifErr); }

    if (userRole === UserRole.Farmer) {
      const farmerCropIds = await CropListing.find({ farmerId: userId }).distinct('_id');
      await CropListing.deleteMany({ farmerId: userId });
      await Review.deleteMany({ cropId: { $in: farmerCropIds } });
    }
    await Review.deleteMany({ userId });
    await Order.deleteMany({ $or: [{ buyerId: userId }, { farmerId: userId }] });
    await Wishlist.deleteMany({ userId });
    await Notification.deleteMany({ userId });
    await User.findByIdAndDelete(userId);

    try {
      await AuditLog.create({
        adminId, adminEmail, action: 'USER_DELETED', resourceType: 'User',
        resourceId: userId, resourceDetails: `${userName} (${userEmail})`, reason: reason || 'Deleted by admin',
        ipAddress, userAgent, status: 'success',
      });
    } catch (auditErr) { console.error('Audit log error:', auditErr); }

    return userName;
  }
}
