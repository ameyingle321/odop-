/**
 * Payment Joi validation schemas.
 */

import Joi from 'joi';
import { uuidSchema } from './common.validator.js';

export const createPaymentOrderSchema = Joi.object({
  order_id: uuidSchema.required().messages({
    'string.guid': 'A valid order UUID is required',
    'any.required': 'Order ID is required',
  }),
});

export const verifyPaymentSchema = Joi.object({
  order_id: uuidSchema.required().messages({
    'string.guid': 'A valid order UUID is required',
    'any.required': 'Order ID is required',
  }),
  razorpay_order_id: Joi.string().trim().required().messages({
    'any.required': 'Razorpay order ID is required',
  }),
  razorpay_payment_id: Joi.string().trim().required().messages({
    'any.required': 'Razorpay payment ID is required',
  }),
  razorpay_signature: Joi.string().trim().required().messages({
    'any.required': 'Razorpay signature is required',
  }),
});

export const paymentFailureSchema = Joi.object({
  order_id: uuidSchema.required().messages({
    'string.guid': 'A valid order UUID is required',
    'any.required': 'Order ID is required',
  }),
  provider_order_id: Joi.string().trim().optional(),
  error_code: Joi.string().trim().optional(),
  error_description: Joi.string().trim().optional(),
});
