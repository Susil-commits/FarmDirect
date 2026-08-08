/**
 * Domain interfaces & Data-Transfer-Objects (DTOs) for the FaRm marketplace.
 * These describe the shape of every Mongoose document as well as the request
 * / response payloads exchanged with the API.
 */
import type { Types, Document } from 'mongoose';
import type * as Enums from './enums.js';


/** Fields added to every document by `{ timestamps: true }` on Mongoose. */
export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

/** The minimal user object attached to `req.user` by the auth middleware. */
export interface AuthUser {
  _id: Types.ObjectId;
  role: Enums.UserRole;
  email: string;
  status: Enums.UserStatus;
}


export interface IUserAddress {
  _id?: Types.ObjectId;
  streetAddress?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export interface IKycDocumentEntry {
  fileName?: string;
  url?: string;
  publicId?: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt?: Date;
  aadharNumber?: string;
}

export interface IKycDetails {
  aadharNumber?: string;
  governmentIdType?: string;
  governmentIdNumber?: string;
  dateOfBirth?: Date;
  profilePhotoUrl?: string;
}

export interface INotificationPreferences {
  orderUpdates?: boolean;
  cropUpdates?: boolean;
  reviews?: boolean;
  promotions?: boolean;
  email?: boolean;
  push?: boolean;
}

export interface ISocialAuth {
  provider: Enums.SocialAuthProvider | null;
  providerId?: string;
}

export interface ISocialLinks {
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
}

export interface IUser extends Timestamps, Document {
  firstName: string;
  lastName: string;
  name?: string;
  email: string;
  password?: string;
  phone?: string;
  role: Enums.UserRole;
  status: Enums.UserStatus;
  suspensionReason?: string;
  profilePicture?: string | null;
  bio?: string;
  address?: string;
  location?: string;
  city?: string;
  state?: string;
  pincode?: string;
  farmName?: string;
  farmArea?: string;
  cropsGrown?: string[];
  farmImages?: string[];
  experience?: number;
  kycStatus: Enums.KycStatus;
  kycSubmittedAt?: Date;
  kycVerifiedAt?: Date;
  kycRejectionReason?: string;
  kycComments?: string;
  kycResultSeen?: boolean;
  kycDocuments?: Record<string, IKycDocumentEntry>;
  kycDetails?: IKycDetails;
  rating?: number;
  totalReviews?: number;
  addresses?: IUserAddress[];
  verified?: boolean;
  emailVerified?: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  socialLinks?: ISocialLinks;
  socialAuth?: ISocialAuth;
  notificationPreferences?: INotificationPreferences;
  blockedUsers?: Types.ObjectId[];
}


export interface ICropSpecifications {
  size?: string;
  color?: string;
  ripeness?: string;
  shelfLife?: string;
  storageInstructions?: string;
  organicCertified?: boolean;
}

export interface IInterestedBuyer {
  buyerId: Types.ObjectId;
  status: Enums.InterestedBuyerStatus;
  interestedAt: Date;
  orderId?: Types.ObjectId | null;
}

export interface IRestockHistoryEntry {
  date: Date;
  quantityAdded: number;
  previousQuantity: number;
}

export interface IDailySalesEntry {
  date: Date;
  quantity: number;
  revenue: number;
}

export interface IMonthlyStats {
  totalRevenue: number;
  totalUnits: number;
  averageRating: number;
}

export interface ICropListing extends Timestamps, Document {
  farmerId: Types.ObjectId;
  cropName: string;
  cropType: Enums.CropType;
  category: Enums.CropCategory;
  price: number;
  originalPrice?: number | null;
  quantity: number;
  unit: Enums.CropUnit;
  description: string;
  images: string[];
  pickupLocation: string;
  contactNumber: string;
  discount?: number;
  specifications?: ICropSpecifications;
  certifications?: string[];
  harvestDate?: Date;
  rating?: number;
  totalReviews?: number;
  status: Enums.CropStatus;
  availability: Enums.CropAvailability;
  listingApprovalStatus: Enums.ListingApprovalStatus;
  rejectionReason?: string;
  interestedBuyers: IInterestedBuyer[];
  views?: number;
  sold?: number;
  likes?: number;
  lowStockThreshold?: number;
  lastRestockDate?: Date;
  restockHistory?: IRestockHistoryEntry[];
  dailySales?: IDailySalesEntry[];
  monthlyStats?: IMonthlyStats;
}


export interface IOrderTimelineEntry {
  event: string;
  description?: string;
  timestamp: Date;
}

export interface IOrderReview {
  rating?: number;
  comment?: string;
  reviewedAt?: Date;
}

export interface IOrder extends Timestamps, Document {
  orderNumber: string;
  buyerId: Types.ObjectId;
  farmerId: Types.ObjectId;
  cropId: Types.ObjectId;
  cropName?: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  originalAmount?: number;
  discountAmount?: number;
  couponCode?: string | null;
  pickupLocation?: string;
  farmerContact?: string;
  buyerContact?: string;
  orderStatus: Enums.OrderStatus;
  paymentMethod: Enums.PaymentMethod;
  paymentStatus: Enums.PaymentStatus;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  razorpaySignature?: string | null;
  timeline: IOrderTimelineEntry[];
  notes?: string;
  specialInstructions?: string;
  review?: IOrderReview;
  cancelledAt?: Date;
  cancellationReason?: string;
  cancelledBy?: Enums.CancelledBy;
  completedAt?: Date;
  flaggedAsAnomaly?: boolean;
  anomalyScore?: number | null;
}


export interface IReviewReport {
  reportedBy?: Types.ObjectId;
  reason?: Enums.ReportReason;
  description?: string;
  reportedAt?: Date;
}

export interface IReview extends Timestamps, Document {
  cropId: Types.ObjectId;
  userId: Types.ObjectId;
  rating: number;
  comment: string;
  images?: string[];
  helpful?: number;
  unhelpful?: number;
  reports?: IReviewReport[];
  isApproved?: boolean;
  isFlagged?: boolean;
}


export interface INotification extends Timestamps, Document {
  userId: Types.ObjectId;
  title: string;
  message: string;
  type: Enums.NotificationType;
  relatedId?: string | null;
  data?: Record<string, unknown>;
  actionUrl?: string | null;
  isRead: boolean;
  readAt?: Date | null;
  priority: Enums.NotificationPriority;
}


export interface IMessageAttachment {
  url: string;
  type: 'image' | 'document' | 'other';
  size?: number;
}

export interface IMessageMetadata {
  location?: string;
  deviceType?: string;
}

export interface IMessage extends Timestamps, Document {
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  content: string;
  cropId?: Types.ObjectId | null;
  orderId?: Types.ObjectId | null;
  isRead: boolean;
  readAt?: Date | null;
  type: Enums.MessageType;
  attachments?: IMessageAttachment[];
  conversationId: string;
  isDeleted?: boolean;
  isEdited?: boolean;
  editedAt?: Date | null;
  replyTo?: Types.ObjectId | null;
  metadata?: IMessageMetadata;
}


export interface IWishlist extends Timestamps, Document {
  userId: Types.ObjectId;
  cropId: Types.ObjectId;
  addedAt?: Date;
}

export interface ICoupon extends Timestamps, Document {
  code: string;
  description?: string;
  type: Enums.CouponType;
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  usedCount: number;
  usedBy: Types.ObjectId[];
  perUserLimit: number;
  validFrom?: Date;
  validUntil?: Date | null;
  isActive: boolean;
  applicableCategories?: string[];
  createdBy?: Types.ObjectId | null;
}

export interface IContact {
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'resolved';
  reply?: string | null;
  createdAt: Date;
  repliedAt?: Date | null;
}

export interface IContactQueryAdminResponse {
  respondedBy?: Types.ObjectId | null;
  responseMessage?: string | null;
  respondedAt?: Date | null;
}

export interface IContactQuery extends Timestamps, Document {
  userId?: Types.ObjectId | null;
  name: string;
  email: string;
  phone?: string;
  inquiryType: Enums.InquiryType;
  message: string;
  status: Enums.ContactQueryStatus;
  adminResponse?: IContactQueryAdminResponse;
  priority: Enums.ContactQueryPriority;
  internalNotes?: string | null;
  isDeleted: boolean;
}

export interface IAuditLog extends Timestamps, Document {
  adminId: Types.ObjectId;
  adminEmail: string;
  action: string;
  resourceType: Enums.ResourceType;
  resourceId: Types.ObjectId;
  resourceDetails?: string;
  changes?: { before: unknown; after: unknown };
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  status: Enums.AuditStatus;
  errorMessage?: string;
  timestamp: Date;
}


export interface RegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: Enums.UserRole;
  phone?: string;
  location?: string;
  photo?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface CreateCropDto {
  cropName: string;
  cropType?: Enums.CropType;
  category?: Enums.CropCategory;
  price: number;
  quantity: number;
  unit?: Enums.CropUnit;
  description?: string;
  pickupLocation: string;
  contactNumber: string;
  specifications?: string | ICropSpecifications;
}

export interface CreateOrderDto {
  cropId: string;
  quantity?: number;
  couponCode?: string;
  paymentMethod?: Enums.PaymentMethod;
}

export interface AddReviewDto {
  cropId: string;
  rating: number;
  comment: string;
}

export interface SendMessageDto {
  receiverId: string;
  content: string;
  cropId?: string;
  orderId?: string;
  type?: Enums.MessageType;
  attachments?: IMessageAttachment[];
}

export interface CreateCouponDto {
  code: string;
  description?: string;
  type: Enums.CouponType;
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  perUserLimit?: number;
  validFrom?: Date;
  validUntil?: Date;
  isActive?: boolean;
  applicableCategories?: string[];
}

export interface SubmitContactDto {
  name: string;
  email: string;
  phone?: string;
  inquiryType: Enums.InquiryType;
  message: string;
}


export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiResponse<T = unknown> {
  success?: boolean;
  message?: string;
  data?: T;
  [key: string]: unknown;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: Pagination;
}

/** A discount computation result returned by the coupon helper. */
export interface DiscountResult {
  discountAmount: number;
  finalAmount: number;
}

/** Order status transition map used by the order workflow. */
export type OrderTransitionMap = Record<Enums.OrderStatus, Enums.OrderStatus[]>;

/** Minimal order shape used by socket event helpers (avoids importing the full model). */
export interface OrderLike {
  _id: Types.ObjectId | string;
  orderNumber: string;
  orderStatus: string;
  cropName?: string;
  totalAmount?: number;
  buyerId: Types.ObjectId | string;
  farmerId: Types.ObjectId | string;
  cropId: Types.ObjectId | string;
  quantity: number;
}

export type PopulatedDocType<T> = T extends Document<infer U>
  ? T
  : T | null;

/** File metadata attached to the request by the upload middleware. */
export interface UploadedFileMeta {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface UploadedFileMetaWithField extends UploadedFileMeta {
  fieldName: string;
  publicId?: string;
}
