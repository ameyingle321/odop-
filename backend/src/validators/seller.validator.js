/**
 * Seller-related Joi validation schemas.
 */

import Joi from 'joi';
import { requiredString, phoneSchema } from './common.validator.js';

/**
 * PUT /api/seller/profile — Update Seller Profile
 */
export const updateSellerProfileSchema = Joi.object({
  business_name: requiredString.max(200).optional(),
  phone: phoneSchema.optional().allow('', null),
  address: requiredString.max(500).optional(),
  state: requiredString.max(100).optional(),
}).min(1);
