// src/constants/index.js
// Central application constants

export const ORDER_STATUSES = {
  PENDING:    'pending',
  CONFIRMED:  'confirmed',
  SHIPPED:    'shipped',
  DELIVERED:  'delivered',
  CANCELLED:  'cancelled',
};

export const ORDER_STATUS_LABELS = {
  pending_payment: 'Pending Payment',
  pending:         'Pending',
  confirmed:       'Confirmed',
  processing:      'Crafting in Studio',
  shipped:         'Shipped',
  delivered:       'Delivered',
  cancelled:       'Cancelled',
};

export const ORDER_STATUS_COLORS = {
  pending_payment: 'warning',
  pending:         'warning',
  confirmed:       'info',
  processing:      'warning',
  shipped:         'accent',
  delivered:       'success',
  cancelled:       'error',
};

export const USER_ROLES = {
  BUYER:  'buyer',
  SELLER: 'seller',
  ADMIN:  'admin',
};

export const PRODUCT_STATUSES = {
  ACTIVE:      'active',
  INACTIVE:    'inactive',
  OUT_OF_STOCK:'out_of_stock',
};

export const SELLER_STATUSES = {
  PENDING:  'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const SORT_OPTIONS = [
  { value: 'created_at:desc', label: 'Newest First' },
  { value: 'price:asc',       label: 'Price: Low to High' },
  { value: 'price:desc',      label: 'Price: High to Low' },
  { value: 'name:asc',        label: 'Name: A–Z' },
];

export const PAGE_SIZE = 12;

export const RAZORPAY_CURRENCY = 'INR';
