
export enum UserRole {
  Farmer = 'farmer',
  Buyer = 'buyer',
  Admin = 'admin',
}

export enum UserStatus {
  Active = 'active',
  Suspended = 'suspended',
  Banned = 'banned',
}

export enum KycStatus {
  NotSubmitted = 'not_submitted',
  Pending = 'pending',
  Verified = 'verified',
  Rejected = 'rejected',
}

export enum SocialAuthProvider {
  Google = 'google',
  GitHub = 'github',
  Facebook = 'facebook',
}

export enum CropType {
  Vegetables = 'vegetables',
  Crops = 'crops',
}

export enum CropCategory {
  Vegetables = 'vegetables',
  Fruits = 'fruits',
  Grains = 'grains',
  Pulses = 'pulses',
  Spices = 'spices',
  Dairy = 'dairy',
  Meat = 'meat',
  Seeds = 'seeds',
  Herbs = 'herbs',
  Other = 'other',
}

export enum CropUnit {
  Kg = 'kg',
  Piece = 'piece',
  Dozen = 'dozen',
  Liter = 'liter',
  Box = 'box',
  Bundle = 'bundle',
}

export enum CropStatus {
  Active = 'active',
  Inactive = 'inactive',
  SoldOut = 'soldOut',
}

export enum CropAvailability {
  Available = 'available',
  NotAvailable = 'not_available',
}

export enum ListingApprovalStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

export enum InterestedBuyerStatus {
  Interested = 'interested',
  Uninterested = 'uninterested',
  Ordered = 'ordered',
}

export enum OrderStatus {
  Confirmed = 'confirmed',
  Preparing = 'preparing',
  ReadyForPickup = 'ready_for_pickup',
  PickedUp = 'picked_up',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export enum PaymentMethod {
  Cod = 'cod',
  Razorpay = 'razorpay',
}

export enum PaymentStatus {
  Pending = 'pending',
  Completed = 'completed',
  Failed = 'failed',
}

export enum CancelledBy {
  Buyer = 'buyer',
  Farmer = 'farmer',
  Admin = 'admin',
}

export enum NotificationType {
  Order = 'order',
  Interest = 'interest',
  Review = 'review',
  Payment = 'payment',
  Promotion = 'promotion',
  Inventory = 'inventory',
  General = 'general',
}

export enum NotificationPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}

export enum MessageType {
  Text = 'text',
  Image = 'image',
  File = 'file',
  Notification = 'notification',
}

export enum CouponType {
  Percentage = 'percentage',
  Fixed = 'fixed',
}

export enum InquiryType {
  General = 'General',
  Support = 'Support',
  Partnership = 'Partnership',
  FarmerPartnership = 'Farmer Partnership',
  Feedback = 'Feedback',
}

export enum ContactQueryStatus {
  New = 'New',
  Read = 'Read',
  InProgress = 'In Progress',
  Resolved = 'Resolved',
  Closed = 'Closed',
}

export enum ContactQueryPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Urgent = 'Urgent',
}

export enum ReportReason {
  Spam = 'spam',
  Inappropriate = 'inappropriate',
  False = 'false',
  Other = 'other',
}

export enum AuditAction {
  UserCreated = 'USER_CREATED',
  UserUpdated = 'USER_UPDATED',
  UserDeleted = 'USER_DELETED',
  UserRoleChanged = 'USER_ROLE_CHANGED',
  UserSuspended = 'USER_SUSPENDED',
  UserBanned = 'USER_BANNED',
  CropApproved = 'CROP_APPROVED',
  CropRejected = 'CROP_REJECTED',
  CropDeleted = 'CROP_DELETED',
  OrderStatusChanged = 'ORDER_STATUS_CHANGED',
  OrderResolved = 'ORDER_RESOLVED',
  RefundIssued = 'REFUND_ISSUED',
  KycApproved = 'KYC_APPROVED',
  KycRejected = 'KYC_REJECTED',
  Login = 'LOGIN',
  Logout = 'LOGOUT',
}

export enum ResourceType {
  User = 'User',
  Crop = 'Crop',
  Order = 'Order',
  Review = 'Review',
  KYC = 'KYC',
}

export enum AuditStatus {
  Success = 'success',
  Failed = 'failed',
}

export enum NegotiationStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  Rejected = 'rejected',
  CounterOffered = 'counter_offered',
}
