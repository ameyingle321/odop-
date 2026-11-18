import Joi from 'joi';
import { uuidSchema } from './common.validator.js';

export const addToCartSchema = Joi.object({
  product_id: uuidSchema.required().messages({
    'string.guid': 'A valid product UUID is required',
    'any.required': 'Product ID is required',
  }),
  quantity: Joi.number().integer().min(1).default(1).messages({
    'number.min': 'Quantity must be at least 1',
    'number.integer': 'Quantity must be an integer',
  }),
});

export const updateCartItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).required().messages({
    'number.min': 'Quantity must be at least 1',
    'number.integer': 'Quantity must be an integer',
    'any.required': 'Quantity is required',
  }),
});
