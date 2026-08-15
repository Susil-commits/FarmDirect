
import api from './api.js';

export const orderTrackingService = {
  
  getUserOrders: async () => {
    try {
      return await api.get('/orders/my-orders');
    } catch (error) {
      console.error('Get orders error:', error);
      throw error;
    }
  },

  getOrderDetails: async (orderId) => {
    try {
      return await api.get(`/orders/${orderId}`);
    } catch (error) {
      console.error('Get order details error:', error);
      throw error;
    }
  },

  cancelOrder: async (orderId, reason) => {
    try {
      return await api.post(`/orders/${orderId}/cancel`, { reason });
    } catch (error) {
      console.error('Cancel order error:', error);
      throw error;
    }
  },

  getTrackingTimeline: async (orderId) => {
    try {
      return await api.get(`/orders/${orderId}/tracking`);
    } catch (error) {
      console.error('Get tracking error:', error);
      throw error;
    }
  },

  requestReturn: async (orderId, data) => {
    try {
      return await api.post(`/orders/${orderId}/return`, data);
    } catch (error) {
      console.error('Return request error:', error);
      throw error;
    }
  },
};
