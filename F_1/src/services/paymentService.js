/**
 * Payment Service - COD Implementation with Future Razorpay Support
 * 
 * Project: FaRm - Farm Marketplace Application
 * Status: COLLEGE PROJECT (May 12, 2026)
 * 
 * CURRENT: Cash on Delivery (COD) is the only payment method
 * FUTURE: Razorpay integration ready (architecture prepared, commented out)
 * 
 * Architecture:
 * - COD: Direct order creation → Verification call → Admin approval → Delivery → Payment collection
 * - Razorpay (TODO): Order creation → Razorpay session → Payment → Confirmation → Delivery
 */

import api from './api';

const paymentService = {
  // ============================================
  // COD PAYMENT (CURRENT - PRODUCTION READY)
  // ============================================
  
  /**
   * Create order with COD payment
   * Workflow: No upfront payment, cash collected on delivery
   * Status transitions: pending → verification_pending → admin_approval_pending → ready_for_delivery → delivered
   */
  createCODOrder: async (orderData) => {
    const payload = {
      ...orderData,
      paymentMethod: 'cod',
      paymentStatus: 'pending'
    };
    return api.post('/orders', payload);
  },

  /**
   * Mark COD payment as received (Farmer/Admin only)
   * Called when cash is physically collected from customer
   * 
   * @param {string} orderId - Order ID
   * @param {number} amount - Amount received
   * @param {string} notes - Optional payment notes
   * @returns {Promise} Order with updated payment status
   */
  markCODPaymentReceived: async (orderId, amount, notes = '') => {
    return api.put(`/orders/${orderId}/payment/received`, {
      amount,
      notes
    });
  },

  /**
   * Get COD payment status for an order
   * Shows payment amount, when received, and who received it
   */
  getCODPaymentStatus: async (orderId) => {
    return api.get(`/orders/${orderId}/payment/status`);
  },

  /**
   * Get all pending COD payments (Farmer view)
   * Farmers can see orders awaiting payment collection
   */
  getPendingCODPayments: async () => {
    return api.get('/orders/payment/pending-cod');
  },

  // ============================================
  // RAZORPAY PAYMENT (FUTURE - ARCHITECTURE ONLY)
  // ============================================

  /**
   * TODO: Initialize Razorpay payment session
   * 
   * IMPLEMENTATION STEPS:
   * 1. Backend: Create /api/payments/razorpay/init endpoint
   * 2. Backend: Create /api/payments/razorpay/verify endpoint
   * 3. Frontend: Load Razorpay script in index.html
   * 4. Frontend: Get keys from environment variables
   * 5. Frontend: Implement payment flow in Checkout component
   * 6. Backend: Update Order model to support 'razorpay' payment method
   * 
   * CURRENT PLACEHOLDER CODE (Commented Out):
   */

  /*
  // Razorpay configuration
  razorpayConfig: {
    keyId: process.env.REACT_APP_RAZORPAY_KEY,
    display: 'default',
    theme: {
      color: '#10b981' // Emerald green (brand color)
    }
  },

  // Initialize Razorpay payment session for an order
  initializeRazorpayPayment: async (orderId, amount) => {
    try {
      const response = await api.post('/api/payments/razorpay/init', {
        orderId,
        amount,
        currency: 'INR'
      });
      return {
        razorpayOrderId: response.data.razorpayOrderId,
        amount: response.data.amount,
        currency: response.data.currency
      };
    } catch (error) {
      console.error('Razorpay initialization failed:', error);
      throw new Error('Failed to initialize payment');
    }
  },

  // Handle Razorpay payment callback/webhook
  handleRazorpayCallback: async (paymentData) => {
    try {
      const response = await api.post('/api/payments/razorpay/verify', {
        razorpayPaymentId: paymentData.razorpay_payment_id,
        razorpayOrderId: paymentData.razorpay_order_id,
        razorpaySignature: paymentData.razorpay_signature,
        orderId: paymentData.orderId
      });
      return response.data;
    } catch (error) {
      console.error('Payment verification failed:', error);
      throw new Error('Payment verification failed');
    }
  },

  // Get Razorpay payment details
  getRazorpayPaymentStatus: async (paymentId) => {
    return api.get(`/api/payments/razorpay/${paymentId}/status`);
  },

  // Handle payment failure
  handlePaymentFailure: async (orderId, reason) => {
    return api.post(`/api/orders/${orderId}/payment/failed`, {
      reason,
      failedAt: new Date()
    });
  },

  // Refund flow (for future use)
  initiateRefund: async (orderId, amount) => {
    return api.post(`/api/payments/razorpay/refund`, {
      orderId,
      amount
    });
  }
  */
};

export default paymentService;

/**
 * MIGRATION GUIDE: COD → Razorpay
 * 
 * When ready to implement Razorpay:
 * 
 * 1. Backend Changes:
 *    - Add 'razorpay' to Order.paymentMethod enum
 *    - Create Razorpay init endpoint (POST /api/payments/razorpay/init)
 *    - Create Razorpay verify endpoint (POST /api/payments/razorpay/verify)
 *    - Add Razorpay keys to .env
 *    - Install razorpay npm package
 * 
 * 2. Frontend Changes:
 *    - Add Razorpay script to index.html
 *    - Uncomment paymentService functions above
 *    - Update Checkout.jsx to show payment method selector
 *    - Add Razorpay payment button to Checkout
 *    - Handle payment success/failure flows
 * 
 * 3. Environment Variables:
 *    - REACT_APP_RAZORPAY_KEY=<your_key>
 *    - Backend: RAZORPAY_KEY_ID=<key>
 *    - Backend: RAZORPAY_KEY_SECRET=<secret>
 * 
 * 4. Testing:
 *    - Use Razorpay test credentials
 *    - Test card: 4111 1111 1111 1111
 *    - Test flow: Checkout → Payment → Success/Failure
 * 
 * 5. Production:
 *    - Switch to Razorpay live keys
 *    - Update payment method selection in UI
 *    - Remove COD-only restrictions
 *    - Keep COD as fallback option
 */
