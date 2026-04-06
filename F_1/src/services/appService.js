import api from './api.js';

export const authService = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => {
    localStorage.removeItem('token');
    return Promise.resolve();
  },
  getCurrentUser: () => api.get('/auth/me'),
  updatePassword: (passwordData) => api.put('/auth/password', passwordData),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password })
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
  createCrop: (data) => api.post('/crops', data),
  updateCrop: (id, data) => api.put(`/crops/${id}`, data),
  deleteCrop: (id) => api.delete(`/crops/${id}`),
  searchCrops: (query, filters) => api.get('/crops/search', { params: { q: query, ...filters } }),
  getFarmerCrops: (farmerId, params) => api.get(`/crops/farmer/${farmerId}`, { params }),
  updateCropStatus: (id, status) => api.patch(`/crops/${id}/status`, { status })
};

export const orderService = {
  getOrders: (params) => api.get('/orders', { params }),
  getOrderById: (id) => api.get(`/orders/${id}`),
  createOrder: (data) => api.post('/orders', data),
  updateOrder: (id, data) => api.put(`/orders/${id}`, data),
  cancelOrder: (id) => api.patch(`/orders/${id}/cancel`, {}),
  getOrderStatus: (orderId) => api.get(`/orders/${orderId}/status`),
  trackOrder: (orderId) => api.get(`/orders/${orderId}/track`)
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
  addToWishlist: (cropId) => api.post(`/wishlist/${cropId}`, {}),
  removeFromWishlist: (cropId) => api.delete(`/wishlist/${cropId}`),
  isInWishlist: (cropId) => api.get(`/wishlist/item/${cropId}`)
};

export const notificationService = {
  getNotifications: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread/count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`, {}),
  markAllAsRead: () => api.put('/notifications/read/all', {}),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  deleteAllNotifications: () => api.delete('/notifications/delete/all')
};

export const adminService = {
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  toggleUserStatus: (userId, status) => api.patch(`/admin/users/${userId}/status`, { status }),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  getPendingKYC: (params) => api.get('/admin/kyc/pending', { params }),
  approveFarmerKYC: (farmerId, data) => api.patch(`/admin/kyc/${farmerId}/approve`, data),
  rejectFarmerKYC: (farmerId, data) => api.patch(`/admin/kyc/${farmerId}/reject`, data),
  getAllCrops: (params) => api.get('/admin/crops', { params }),
  approveCrop: (cropId) => api.patch(`/admin/crops/${cropId}/approve`, {}),
  rejectCrop: (cropId, reason) => api.patch(`/admin/crops/${cropId}/reject`, { reason }),
  getAllOrders: (params) => api.get('/admin/orders', { params }),
  updateOrderStatus: (orderId, status) => api.patch(`/admin/orders/${orderId}/status`, { orderStatus: status })
};
