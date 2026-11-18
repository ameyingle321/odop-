// src/services/paymentService.js
// Razorpay Payment integration

import api from '../lib/axios';

export const paymentService = {
  /**
   * Create Razorpay order on backend
   */
  async createRazorpayOrder(orderId) {
    const { data } = await api.post('/payments/create-order', { order_id: orderId });
    return data;
  },

  /**
   * Cryptographically verify payment on backend
   */
  async verifyPayment(paymentData) {
    const { data } = await api.post('/payments/verify', {
      order_id: paymentData.order_id,
      razorpay_order_id: paymentData.razorpay_order_id,
      razorpay_payment_id: paymentData.razorpay_payment_id,
      razorpay_signature: paymentData.razorpay_signature,
    });
    return data;
  },

  /**
   * Record payment attempt failure on backend
   */
  async recordFailure(failureData) {
    const { data } = await api.post('/payments/failure', {
      order_id: failureData.order_id,
      provider_order_id: failureData.provider_order_id,
      error_code: failureData.error_code,
      error_description: failureData.error_description,
    });
    return data;
  },

  /**
   * Load Razorpay checkout SDK script dynamically
   */
  loadRazorpayScript() {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  },

  /**
   * Open Razorpay checkout modal
   */
  async openCheckout({ razorpayOrderId, amount, currency = 'INR', name = 'ODOP Nexus', description, prefill, onSuccess, onFailure }) {
    const key = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_odopnexus1234';
    const loaded = await this.loadRazorpayScript();

    if (!loaded || !window.Razorpay) {
      // In development/test if external script is blocked, provide graceful mock option
      const proceedMock = window.confirm(
        'Razorpay CDN is offline or unavailable. Would you like to proceed with mock test payment verification?'
      );
      if (proceedMock) {
        onSuccess({
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          razorpay_signature: 'sig_mock_verified',
        });
        return;
      }
      throw new Error('Could not load Razorpay payment gateway');
    }

    const options = {
      key,
      amount,
      currency,
      name,
      description: description || 'Artisan Marketplace Order',
      order_id: razorpayOrderId,
      prefill: {
        name: prefill?.name || '',
        email: prefill?.email || '',
        contact: prefill?.contact || '',
      },
      theme: {
        color: '#D97706', // Skanvi artisan gold
      },
      handler: (response) => {
        if (onSuccess) onSuccess(response);
      },
      modal: {
        ondismiss: () => {
          if (onFailure) onFailure(new Error('Payment window closed by user'));
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response) => {
      if (onFailure) onFailure(response.error);
    });
    rzp.open();
  },
};
