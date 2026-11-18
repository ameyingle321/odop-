/**
 * Payment Routes.
 *
 * Endpoints:
 *   POST /api/payments/create-order  — Initiate payment entity with Razorpay
 *   POST /api/payments/verify        — Cryptographically verify payment signature & confirm order
 *   POST /api/payments/failure       — Record payment attempt failure
 *   GET  /api/payments/order/:orderId— Get payment records for an order
 *   POST /api/payments/webhook       — Razorpay webhook listener
 */

import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller.js';
import authenticate from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import {
  createPaymentOrderSchema,
  verifyPaymentSchema,
  paymentFailureSchema,
} from '../validators/index.js';

const router = Router();

// Webhook endpoint (public with internal HMAC signature verification)
router.post('/payments/webhook', paymentController.handleWebhook);

// Authenticated customer/seller endpoints
router.post(
  '/payments/create-order',
  authenticate,
  validate(createPaymentOrderSchema),
  paymentController.createPaymentOrder
);

router.post(
  '/payments/verify',
  authenticate,
  validate(verifyPaymentSchema),
  paymentController.verifyPayment
);

router.post(
  '/payments/failure',
  authenticate,
  validate(paymentFailureSchema),
  paymentController.recordFailure
);

router.get(
  '/payments/order/:orderId',
  authenticate,
  paymentController.getPaymentsByOrder
);

export default router;
