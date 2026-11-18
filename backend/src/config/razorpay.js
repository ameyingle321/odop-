/**
 * Razorpay Configuration & Signature Verification.
 *
 * Implements server-side cryptographic verification for Razorpay payment results:
 *   - HMAC-SHA256 signature verification for payment verification
 *   - Webhook signature verification
 *   - Seamless fallback for test environments
 *
 * See: TRD §15 — Payment Integration
 */

import crypto from 'crypto';
import Razorpay from 'razorpay';
import env from './env.js';
import logger from '../utils/logger.js';

let razorpayClient = null;

try {
  razorpayClient = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
} catch (err) {
  logger.warn('Failed to initialize Razorpay client with provided keys', { error: err.message });
}

export { razorpayClient };

/**
 * Verify Razorpay payment signature (HMAC-SHA256).
 *
 * Signature format expected:
 *   HMAC_SHA256(razorpay_order_id + '|' + razorpay_payment_id, secret)
 *
 * @param {object} params
 * @param {string} params.order_id - Razorpay order ID (e.g. order_xxx)
 * @param {string} params.payment_id - Razorpay payment ID (e.g. pay_xxx)
 * @param {string} params.signature - Razorpay signature to verify
 * @returns {boolean} True if signature is cryptographically valid
 */
export function verifyRazorpaySignature({ order_id, payment_id, signature }) {
  if (!order_id || !payment_id || !signature) return false;

  try {
    const payload = `${order_id}|${payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(payload)
      .digest('hex');

    const bufA = Buffer.from(expectedSignature, 'utf-8');
    const bufB = Buffer.from(signature, 'utf-8');
    if (bufA.length !== bufB.length) return false;

    return crypto.timingSafeEqual(bufA, bufB);
  } catch (err) {
    logger.error('Signature verification error', { error: err.message });
    return false;
  }
}

/**
 * Generate a valid Razorpay signature for testing / sandbox verification.
 *
 * @param {string} order_id
 * @param {string} payment_id
 * @returns {string} Hex-encoded HMAC-SHA256 signature
 */
export function generateTestSignature(order_id, payment_id) {
  const payload = `${order_id}|${payment_id}`;
  return crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(payload)
    .digest('hex');
}

/**
 * Generate a valid Razorpay webhook signature for testing.
 *
 * @param {object|string} payload
 * @returns {string}
 */
export function generateTestWebhookSignature(payload) {
  const raw = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto
    .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
    .update(raw)
    .digest('hex');
}

/**
 * Verify webhook signature (HMAC-SHA256).
 *
 * @param {string|object} body - Raw webhook body
 * @param {string} signature - X-Razorpay-Signature header
 * @returns {boolean}
 */
export function verifyWebhookSignature(body, signature) {
  if (!signature || !env.RAZORPAY_WEBHOOK_SECRET) return false;

  try {
    const rawPayload = typeof body === 'string' ? body : JSON.stringify(body);
    const expected = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawPayload)
      .digest('hex');

    const bufA = Buffer.from(expected, 'utf-8');
    const bufB = Buffer.from(signature, 'utf-8');
    if (bufA.length !== bufB.length) return false;

    return crypto.timingSafeEqual(bufA, bufB);
  } catch (err) {
    return false;
  }
}
