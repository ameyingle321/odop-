/**
 * Payment Controller.
 *
 * Handles HTTP requests for Razorpay payment initiation, signature verification,
 * failure recording, and webhook processing.
 *
 * See: TRD §15 — Payment Integration
 */

import * as paymentService from '../services/payment.service.js';
import { catchAsync, sendSuccess } from '../utils/index.js';
import { HTTP } from '../constants/index.js';

/**
 * POST /api/payments/create-order
 * Initiate a Razorpay payment order for a customer order.
 */
export const createPaymentOrder = catchAsync(async (req, res) => {
  const result = await paymentService.initiatePayment(req.user.id, req.body.order_id);
  sendSuccess(res, result, HTTP.CREATED, 'Payment order initiated');
});

/**
 * POST /api/payments/verify
 * Cryptographically verify Razorpay payment signature and confirm order.
 */
export const verifyPayment = catchAsync(async (req, res) => {
  const result = await paymentService.verifyPayment(req.user.id, req.body);
  sendSuccess(res, result, HTTP.OK, 'Payment verified successfully and order confirmed');
});

/**
 * POST /api/payments/failure
 * Record a payment failure.
 */
export const recordFailure = catchAsync(async (req, res) => {
  const result = await paymentService.recordPaymentFailure(req.user.id, req.body);
  sendSuccess(res, result, HTTP.OK, 'Payment failure recorded');
});

/**
 * GET /api/payments/order/:orderId
 * Get payment attempts for a specific order.
 */
export const getPaymentsByOrder = catchAsync(async (req, res) => {
  const payments = await paymentService.getPaymentsByOrderId(
    req.user.id,
    req.user.role,
    req.params.orderId
  );
  sendSuccess(res, payments, HTTP.OK, 'Payments retrieved successfully');
});

/**
 * POST /api/payments/webhook
 * Handle asynchronous notifications from Razorpay.
 */
export const handleWebhook = catchAsync(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const result = await paymentService.processWebhook(req.body, signature);
  sendSuccess(res, result, HTTP.OK, 'Webhook processed successfully');
});
