// User roles
export const USER_ROLES = {
  FARMER: 'farmer',
  BUYER: 'buyer',
  ADMIN: 'admin'
};

// Order statuses
export const ORDER_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

// Crop status
export const CROP_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SOLD_OUT: 'soldOut'
};

// Listing approval status
export const LISTING_APPROVAL = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

// KYC status
export const KYC_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected'
};

// Crop categories
export const CROP_CATEGORIES = [
  'Vegetables',
  'Fruits',
  'Grains',
  'Pulses',
  'Spices',
  'Fruits & Vegetables',
  'Dairy',
  'Meat & Poultry',
  'Seeds',
  'Herbs'
];

// Notification types
export const NOTIFICATION_TYPES = {
  ORDER: 'order',
  REVIEW: 'review',
  PAYMENT: 'payment',
  PROMOTION: 'promotion',
  GENERAL: 'general'
};

// API endpoints
export const API_ENDPOINTS = {
  AUTH: '/auth',
  USERS: '/users',
  CROPS: '/crops',
  ORDERS: '/orders',
  REVIEWS: '/reviews',
  WISHLIST: '/wishlist',
  NOTIFICATIONS: '/notifications',
  ADMIN: '/admin'
};

// Payment methods
export const PAYMENT_METHODS = {
  RAZORPAY: 'razorpay',
  UPI: 'upi',
  NET_BANKING: 'netBanking',
  WALLET: 'wallet',
  COD: 'cod'
};

// Sorting options
export const SORT_OPTIONS = {
  NEWEST: 'newest',
  PRICE_LOW: 'priceLow',
  PRICE_HIGH: 'priceHigh',
  RATING: 'rating',
  POPULAR: 'popular'
};

// Filter ranges
export const PRICE_RANGES = [
  { min: 0, max: 100, label: '₹0 - ₹100' },
  { min: 100, max: 500, label: '₹100 - ₹500' },
  { min: 500, max: 1000, label: '₹500 - ₹1000' },
  { min: 1000, max: 5000, label: '₹1000 - ₹5000' },
  { min: 5000, max: Infinity, label: '₹5000+' }
];

// String length limits
export const LIMITS = {
  NAME_MAX: 50,
  EMAIL_MAX: 100,
  PHONE_MAX: 20,
  BIO_MAX: 500,
  COMMENT_MAX: 1000,
  CROP_NAME_MAX: 100,
  DESCRIPTION_MAX: 2000
};

// Image upload
export const IMAGE_CONFIG = {
  MAX_SIZE: 5242880, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_IMAGES: 5
};

// Pagination
export const PAGINATION = {
  ITEMS_PER_PAGE: 20,
  ITEMS_PER_PAGE_ADMIN: 50
};

// Date format
export const DATE_FORMAT = {
  SHORT: 'MMM dd, yyyy',
  LONG: 'MMMM dd, yyyy',
  FULL: 'EEEE, MMMM dd, yyyy HH:mm'
};
