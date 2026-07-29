import api from './api.js';
import directApi from './directApi.js';

export const authService = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: async () => {
    try {
      // Call backend to clear the HttpOnly refreshToken cookie
      await api.post('/auth/logout');
    } catch {
      // Ignore errors — even if the backend is unreachable, clear local state
    } finally {
      localStorage.removeItem('token');
    }
  },
  getCurrentUser: () => api.get('/auth/me'),
  // B12 FIX: Route is PUT /auth/update-password, not /auth/password
  updatePassword: (passwordData) => api.put('/auth/update-password', passwordData),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  // Token is sent in the request body — matches backend POST /auth/reset-password
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  submitKYC: (documents) => api.post('/auth/submit-kyc', { documents }),
  // Send KYC documents as FormData with actual files (multipart/form-data)
  // Uses directApi to bypass Vite proxy which corrupts multipart boundaries
  submitKYCFormData: (formData) => directApi.post('/auth/submit-kyc', formData).then(r => r.data),
};

export const userService = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getAddresses: () => api.get('/users/addresses'),
  addAddress: (data) => api.post('/users/address', data),
  deleteAddress: (addressId) => api.delete(`/users/address/${addressId}`),
  getFarmerProfile: (farmerId) => api.get(`/users/farmer/${farmerId}`)
};

export const cropService = {
  getAllCrops: (params) => api.get('/crops', { params }),
  getCropById: (id) => api.get(`/crops/${id}`),
  // Use directApi for create/update with FormData to avoid Vite proxy corrupting multipart boundaries
  createCrop: (data) => directApi.post('/crops', data).then(r => r.data),
  // JSON update (no files) uses regular api which supports token refresh
  updateCrop: (id, data) => api.put(`/crops/${id}`, data),
  // FormData update (with file uploads) uses directApi to bypass Vite proxy
  updateCropWithFiles: (id, formData) => directApi.put(`/crops/${id}`, formData).then(r => r.data),
  deleteCrop: (id) => api.delete(`/crops/${id}`),
  searchCrops: (query, filters) => api.get('/data/crops/search', { params: { q: query, ...filters } }),
  getFarmerCrops: (farmerId, params) => api.get(`/crops/farmer/${farmerId}`, { params }),
  updateCropStatus: (id, status) => api.patch(`/crops/${id}/status`, { status }),
  // Farmer's own listings
  getMyListings: () => api.get('/crops/my-listings'),
  // Interest workflow
  toggleInterest: (cropId) => api.post(`/crops/${cropId}/interest`),
  getInterestedBuyers: (cropId) => api.get(`/crops/${cropId}/interested-buyers`),
  getMyInterestedCrops: () => api.get('/crops/buyer/interested'),
  // Recommendations
  getTrendingCrops: (limit = 8) => api.get('/crops/trending', { params: { limit } }),
  getSimilarCrops: (cropId, limit = 6) => api.get(`/crops/${cropId}/similar`, { params: { limit } }),
  getRecommendedCrops: (limit = 8) => api.get('/crops/buyer/recommended', { params: { limit } }),
};

export const couponService = {
  validate: (code, amount) => api.get('/coupons/validate', { params: { code, amount } }),
};

export const orderService = {
  startOrder: (data) => api.post('/orders/start', data),
  getOrders: (params) => api.get('/orders', { params }),
  getOrderById: (id) => api.get(`/orders/${id}`),
  getOrderDetails: (id) => api.get(`/orders/${id}`),
  createOrder: (data) => api.post('/orders', data),
  checkoutCart: (data) => api.post('/orders/checkout-cart', data),
  updateOrderStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  cancelOrder: (id, cancellationReason) => api.patch(`/orders/${id}/cancel`, { cancellationReason }),
  denyOrder: (id, denialReason) => api.post(`/orders/${id}/deny`, { denialReason }),
  markOrderReceived: (id) => api.patch(`/orders/${id}/receive`),
  getOrderStatus: (orderId) => api.get(`/orders/${orderId}/status`),
  trackOrder: (orderId) => api.get(`/orders/${orderId}/track`),
  addReview: (orderId, data) => api.post(`/orders/${orderId}/review`, data),
  getOrderStats: () => api.get('/orders/stats/summary'),
};

export const reviewService = {
  addReview: (cropId, data) => api.post(`/reviews/${cropId}`, data),
  getReviews: (cropId, params) => api.get(`/reviews/crop/${cropId}`, { params }),
  getFarmerReviews: (farmerId, params) => api.get(`/reviews/farmer/${farmerId}`, { params }),
  deleteReview: (reviewId) => api.delete(`/reviews/${reviewId}`),
  reportReview: (reviewId, data) => api.post(`/reviews/${reviewId}/report`, data)
};

export const wishlistService = {
  getWishlist: (params) => api.get('/wishlist', { params }),
  addToWishlist: (cropId) => api.post('/wishlist', { cropId }),
  removeFromWishlist: (cropId) => api.delete(`/wishlist/${cropId}`),
  isInWishlist: (cropId) => api.get(`/wishlist/check/${cropId}`)
};

export const notificationService = {
  getNotifications: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread/count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`, {}),
  markAllAsRead: () => api.put('/notifications/read/all', {}),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  deleteAllNotifications: () => api.delete('/notifications/delete/all'),
  createNotification: (data) => api.post('/notifications/create', data),
  sendBulkNotifications: (data) => api.post('/notifications/bulk', data)
};

export const adminService = {
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getUsersWithCrops: () => api.get('/admin/users-with-crops'),
  getApprovedFarmers: (search) => api.get('/admin/users/approved/farmers', { params: { search } }),
  getApprovedBuyers: (search) => api.get('/admin/users/approved/buyers', { params: { search } }),
  getSuspendedUsers: (search) => api.get('/admin/users/suspended', { params: { search } }),
  toggleUserStatus: (userId, status, reason) => api.patch(`/admin/users/${userId}/status`, { status, reason }),
  deleteUser: (userId, reason) => api.delete(`/admin/users/${userId}`, { data: { reason } }),
  getPendingKYC: (params) => api.get('/admin/kyc/pending', { params }),
  getRejectedKYC: (params) => api.get('/admin/kyc/rejected', { params }),
  // Test endpoints (no auth required — for debugging when no admin user exists)
  getPendingKYCTest: (params) => api.get('/admin/test/pending-kyc', { params }),
  getRejectedKYCTest: (params) => api.get('/admin/test/rejected-kyc', { params }),
  approveUserKYC: (userId, data) => api.patch(`/admin/kyc/${userId}/approve`, data),
  rejectUserKYC: (userId, data) => api.patch(`/admin/kyc/${userId}/reject`, data),
  markKYCResultSeen: () => api.patch('/admin/kyc/result-seen'),
  getAllCrops: (params) => api.get('/admin/crops', { params }),
  deleteCrop: (cropId, reason) => api.delete(`/admin/crops/${cropId}`, { data: { reason } }),
  freezeCrop: (cropId, reason) => api.patch(`/admin/crops/${cropId}/freeze`, { reason }),
  approveCrop: (cropId) => api.patch(`/admin/crops/${cropId}/approve`, {}),
  rejectCrop: (cropId, reason) => api.patch(`/admin/crops/${cropId}/reject`, { reason }),
  getAllOrders: (params) => api.get('/admin/orders', { params }),
  updateOrderStatus: (orderId, status) => api.patch(`/admin/orders/${orderId}/status`, { orderStatus: status }),
  debugKYCStatus: () => api.get('/admin/debug/users-kyc-status'),
  // Document viewing (admin visibility of user KYC docs, farm images, crop images)
  searchDocuments: (params) => api.get('/admin/documents/search', { params }),
  getUserDocuments: (userId) => api.get(`/admin/documents/${userId}`),
  // Audit logs
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
  // Coupons management
  getCoupons: (params) => api.get('/admin/coupons', { params }),
  createCoupon: (data) => api.post('/admin/coupons', data),
  updateCoupon: (id, data) => api.patch(`/admin/coupons/${id}`, data),
  deleteCoupon: (id) => api.delete(`/admin/coupons/${id}`),
};

export const authServiceExtended = {
  completeOnboarding: (data) => api.post('/auth/complete-onboarding', data),
  deleteAccount: () => api.post('/auth/delete-account')
};
