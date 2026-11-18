/**
 * Review Joi validation schemas.
 */

import Joi from 'joi';
import { uuidSchema, ratingSchema } from './common.validator.js';

export const createReviewSchema = Joi.object({
  order_id: uuidSchema.required().messages({
    'string.guid': 'A valid order UUID is required',
    'any.required': 'Order ID is required',
  }),
  rating: ratingSchema.required().messages({
    'number.base': 'Rating must be a number',
    'number.integer': 'Rating must be an integer',
    'number.min': 'Rating must be at least 1',
    'number.max': 'Rating cannot exceed 5',
    'any.required': 'Rating is required',
  }),
  comment: Joi.string().trim().max(1000).allow('', null).optional().messages({
    'string.max': 'Comment cannot exceed 1000 characters',
  }),
});

export const queryReviewsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  rating: Joi.number().integer().min(1).max(5).optional(),
});
