/**
 * Authentication-related Joi validation schemas.
 *
 * These schemas are consumed by the validation middleware
 * to gate auth endpoints (register, login, etc.).
 */

import Joi from 'joi';
import { emailSchema, requiredString, phoneSchema } from './common.validator.js';

/**
 * POST /api/auth/register (Buyer)
 */
export const registerBuyerSchema = Joi.object({
  name: requiredString.max(100).required(),
  email: emailSchema.required(),
  phone: phoneSchema.optional().allow('', null),
  password: requiredString.min(8).max(128).required()
    .messages({ 'string.min': 'Password must be at least 8 characters.' }),
});

/**
 * POST /api/auth/register/seller
 */
export const registerSellerSchema = Joi.object({
  name: requiredString.max(100).required(),
  email: emailSchema.required(),
  phone: phoneSchema.optional().allow('', null),
  password: requiredString.min(8).max(128).required()
    .messages({ 'string.min': 'Password must be at least 8 characters.' }),
  business_name: requiredString.max(200).required(),
  address: requiredString.max(500).required(),
  district_id: Joi.string().uuid({ version: 'uuidv4' }).required(),
  state: requiredString.max(100).required(),
});

/**
 * POST /api/auth/login
 */
export const loginSchema = Joi.object({
  email: emailSchema.required(),
  password: requiredString.required(),
});
