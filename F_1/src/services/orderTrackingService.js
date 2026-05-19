/**
 * Order Tracking Service
 * Handles order status updates and tracking
 * Uses the configured api instance with auth interceptors
 */
import api from './api.js';

export const orderTrackingService = {
  /**
   * Get all user orders
   */
  getUserOrders: async () => {
    try {
      return await api.get('/orders/my-orders');
    } catch (error) {
      console.error('Get orders error:', error);
      throw error;
    }
  },

  /**
   * Get single order details with tracking
   * @param {string} orderId - Order ID
   */
  getOrderDetails: async (orderId) => {
    try {
      return await api.get(`/orders/${orderId}`);
    } catch (error) {
      console.error('Get order details error:', error);
      throw error;
    }
  },

  /**
   * Cancel order (if eligible)
   * @param {string} orderId - Order ID
   * @param {string} reason - Cancellation reason
   */
  cancelOrder: async (orderId, reason) => {
    try {
      return await api.post(`/orders/${orderId}/cancel`, { reason });
    } catch (error) {
      console.error('Cancel order error:', error);
      throw error;
    }
  },

  /**
   * Get order tracking timeline
   * @param {string} orderId - Order ID
   */
  getTrackingTimeline: async (orderId) => {
    try {
      return await api.get(`/orders/${orderId}/tracking`);
    } catch (error) {
      console.error('Get tracking error:', error);
      throw error;
    }
  },

  /**
   * Request return/refund
   * @param {string} orderId - Order ID
   * @param {object} data - Return details
   */
  requestReturn: async (orderId, data) => {
    try {
      return await api.post(`/orders/${orderId}/return`, data);
    } catch (error) {
      console.error('Return request error:', error);
      throw error;
    }
  },
};
