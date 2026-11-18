/**
 * Product status constants.
 * Controls product visibility and availability in the marketplace.
 */
const PRODUCT_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  REJECTED: 'rejected',
};

const VALID_PRODUCT_STATUSES = new Set(Object.values(PRODUCT_STATUS));

export { PRODUCT_STATUS, VALID_PRODUCT_STATUSES };
