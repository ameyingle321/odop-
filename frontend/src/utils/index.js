// src/utils/index.js
// Small reusable utility functions

/**
 * Format a number as Indian currency (INR)
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a date string in a human-readable format
 */
export function formatDate(dateString) {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString));
}

/**
 * Format date with time
 */
export function formatDateTime(dateString) {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

/**
 * Truncate text to a given length
 */
export function truncate(text, maxLength = 80) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

/**
 * Get initials from a full name
 */
export function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate Indian phone number
 */
export function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''));
}

/**
 * Get error message from an API error
 */
export function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Something went wrong. Please try again.'
  );
}

/**
 * Debounce a function
 */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Generate star rating display
 */
export function getStarRating(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return { full, half, empty };
}

/**
 * Format relative time (e.g. "2 days ago")
 */
export function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  if (months < 12) return `${months}mo ago`;
  return formatDate(dateString);
}

/**
 * Calculate discount percentage
 */
export function discountPercent(original, discounted) {
  if (!original || !discounted) return 0;
  return Math.round(((original - discounted) / original) * 100);
}

export { getProductImageUrl, DEFAULT_PRODUCT_IMAGE } from './productImages';
