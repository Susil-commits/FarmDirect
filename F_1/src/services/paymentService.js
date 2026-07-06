/**
 * Payment Service - COD + Razorpay (Online) Payments
 *
 * Project: FaRm - Farm Marketplace Application
 *
 * Supported methods:
 * - COD: order created → cash collected on pickup
 * - Razorpay: order created → Razorpay checkout → signature verified on server → marked paid
 *
 * Razorpay flow:
 *   1. createOrder() with paymentMethod 'razorpay' (order saved, paymentStatus pending)
 *   2. initializeRazorpayPayment(orderIds) → backend creates Razorpay order, returns keyId + razorpayOrderId
 *   3. openRazorpayCheckout(...) → opens Razorpay modal
 *   4. verifyRazorpayPayment({...}) → backend verifies HMAC signature, marks orders paid
 */

import api from './api';

// ---------------------------------------------------------------------------
// Razorpay checkout script loader (idempotent)
// ---------------------------------------------------------------------------
const RAZORPAY_SCRIPT_ID = 'razorpay-checkout-script';

export const loadRazorpayScript = () =>
  new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      return resolve();
    }
    if (typeof window === 'undefined') {
      return reject(new Error('Razorpay can only run in the browser'));
    }

    const existing = document.getElementById(RAZORPAY_SCRIPT_ID);
    if (existing) {
      if (window.Razorpay) return resolve();
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay script')));
      return;
    }

    const script = document.createElement('script');
    script.id = RAZORPAY_SCRIPT_ID;
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay script'));
    document.body.appendChild(script);
  });

const paymentService = {
  // ============================================
  // COD PAYMENT
  // ============================================

  createCODOrder: async (orderData) => {
    const payload = {
      ...orderData,
      paymentMethod: 'cod',
      paymentStatus: 'pending'
    };
    return api.post('/orders', payload);
  },

  markCODPaymentReceived: async (orderId, amount, notes = '') => {
    return api.put(`/orders/${orderId}/payment/received`, {
      amount,
      notes
    });
  },

  getCODPaymentStatus: async (orderId) => {
    return api.get(`/orders/${orderId}/payment/status`);
  },

  getPendingCODPayments: async () => {
    return api.get('/orders/payment/pending-cod');
  },

  // ============================================
  // RAZORPAY (ONLINE) PAYMENT
  // ============================================

  /**
   * Create a Razorpay order for one or more existing buyer orders.
   * @param {string|string[]} orderIds - single orderId or array of orderIds
   * @returns {Promise<{razorpayOrderId, amount, currency, keyId, orderIds}>}
   */
  initializeRazorpayPayment: async (orderIds) => {
    const payload = Array.isArray(orderIds)
      ? { orderIds }
      : { orderId: orderIds };
    return api.post('/payments/razorpay/init', payload);
  },

  /**
   * Verify a completed Razorpay payment with the server (HMAC signature check).
   * @param {object} data - { razorpayOrderId, razorpayPaymentId, razorpaySignature }
   */
  verifyRazorpayPayment: async ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
    return api.post('/payments/razorpay/verify', {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });
  },

  /**
   * Report a failed payment attempt to the server.
   */
  reportRazorpayFailure: async (razorpayOrderId, reason) => {
    return api.post('/payments/razorpay/failed', { razorpayOrderId, reason });
  },

  /**
   * Open the Razorpay checkout modal.
   * Resolves once the modal is opened (payment result is delivered via callbacks).
   *
   * @param {object} opts
   * @param {string} opts.keyId         - Razorpay key id (returned by initializeRazorpayPayment)
   * @param {string} opts.razorpayOrderId
   * @param {number} opts.amount       - amount in paise
   * @param {string} [opts.name]
   * @param {string} [opts.description]
   * @param {object} [opts.prefill]     - { name, email, contact }
   * @param {function} [opts.onSuccess] - handler(response)
   * @param {function} [opts.onDismiss] - called when user closes the modal
   * @param {function} [opts.onFailure] - handler(error)
   */
  openRazorpayCheckout: async ({
    keyId,
    razorpayOrderId,
    amount,
    name = 'FarmDirect',
    description = 'Fresh produce order',
    prefill = {},
    onSuccess,
    onDismiss,
    onFailure,
  }) => {
    await loadRazorpayScript();

    const options = {
      key: keyId,
      amount, // paise
      currency: 'INR',
      name,
      description,
      order_id: razorpayOrderId,
      prefill,
      theme: { color: '#22c55e' },
      handler: (response) => {
        if (typeof onSuccess === 'function') onSuccess(response);
      },
      modal: {
        ondismiss: () => {
          if (typeof onDismiss === 'function') onDismiss();
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (resp) => {
      if (typeof onFailure === 'function') onFailure(resp?.error);
    });
    rzp.open();
  },
};

export default paymentService;
