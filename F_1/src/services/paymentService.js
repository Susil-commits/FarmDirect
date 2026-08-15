
import api from './api';

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

  initializeRazorpayPayment: async (orderIds) => {
    const payload = Array.isArray(orderIds)
      ? { orderIds }
      : { orderId: orderIds };
    return api.post('/payments/razorpay/init', payload);
  },

  verifyRazorpayPayment: async ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
    return api.post('/payments/razorpay/verify', {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });
  },

  reportRazorpayFailure: async (razorpayOrderId, reason) => {
    return api.post('/payments/razorpay/failed', { razorpayOrderId, reason });
  },

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
      amount,
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
