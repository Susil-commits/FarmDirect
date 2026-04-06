/**
 * Order Tracking Service
 * Handles order status updates and tracking
 */
import { API_BASE_URL } from './api.js';

export const orderTrackingService = {
  /**
   * Get all user orders
   */
  getUserOrders: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/orders/my-orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch orders');
      return await response.json();
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
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch order');
      return await response.json();
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
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) throw new Error('Failed to cancel order');
      return await response.json();
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
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/tracking`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch tracking');
      return await response.json();
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
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to request return');
      return await response.json();
    } catch (error) {
      console.error('Return request error:', error);
      throw error;
    }
  },
};
