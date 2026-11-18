/**
 * Order status constants.
 * Follows the lifecycle defined in the TRD:
 *   PENDING_PAYMENT → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
 *
 * Future statuses (returns/refunds) are noted but not active for MVP.
 */
const ORDER_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

const VALID_ORDER_STATUSES = new Set(Object.values(ORDER_STATUS));

export { ORDER_STATUS, VALID_ORDER_STATUSES };
