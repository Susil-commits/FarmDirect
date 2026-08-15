
export const USER_ROLES = {
  FARMER: 'farmer',
  BUYER: 'buyer',
  ADMIN: 'admin'
};

export const ORDER_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

export const CROP_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SOLD_OUT: 'soldOut'
};

export const LISTING_APPROVAL = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

export const KYC_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected'
};

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

export const NOTIFICATION_TYPES = {
  ORDER: 'order',
  REVIEW: 'review',
  PAYMENT: 'payment',
  PROMOTION: 'promotion',
  GENERAL: 'general'
};

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

export const PAYMENT_METHODS = {
  RAZORPAY: 'razorpay',
  UPI: 'upi',
  NET_BANKING: 'netBanking',
  WALLET: 'wallet',
  COD: 'cod'
};

export const SORT_OPTIONS = {
  NEWEST: 'newest',
  PRICE_LOW: 'priceLow',
  PRICE_HIGH: 'priceHigh',
  RATING: 'rating',
  POPULAR: 'popular'
};

export const PRICE_RANGES = [
  { min: 0, max: 100, label: '₹0 - ₹100' },
  { min: 100, max: 500, label: '₹100 - ₹500' },
  { min: 500, max: 1000, label: '₹500 - ₹1000' },
  { min: 1000, max: 5000, label: '₹1000 - ₹5000' },
  { min: 5000, max: Infinity, label: '₹5000+' }
];

export const LIMITS = {
  NAME_MAX: 50,
  EMAIL_MAX: 100,
  PHONE_MAX: 20,
  BIO_MAX: 500,
  COMMENT_MAX: 1000,
  CROP_NAME_MAX: 100,
  DESCRIPTION_MAX: 2000
};

export const IMAGE_CONFIG = {
  MAX_SIZE: 5242880, 
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_IMAGES: 5
};

export const PAGINATION = {
  ITEMS_PER_PAGE: 20,
  ITEMS_PER_PAGE_ADMIN: 50
};

export const DATE_FORMAT = {
  SHORT: 'MMM dd, yyyy',
  LONG: 'MMMM dd, yyyy',
  FULL: 'EEEE, MMMM dd, yyyy HH:mm'
};
