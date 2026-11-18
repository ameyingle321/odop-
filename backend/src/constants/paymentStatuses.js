/**
 * Payment status constants.
 * Tracks payment lifecycle from creation through Razorpay verification.
 */
const PAYMENT_STATUS = {
  PENDING: 'pending',
  AUTHORIZED: 'authorized',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

const VALID_PAYMENT_STATUSES = new Set(Object.values(PAYMENT_STATUS));

export { PAYMENT_STATUS, VALID_PAYMENT_STATUSES };
