import Joi from 'joi';
import { uuidSchema, requiredString, phoneSchema } from './common.validator.js';
import { ORDER_STATUS } from '../constants/index.js';

export const createOrderSchema = Joi.object({
  delivery_name: requiredString.max(100).required().messages({
    'any.required': 'Recipient name is required',
  }),
  delivery_phone: phoneSchema.required().messages({
    'any.required': 'Delivery phone number is required',
  }),
  delivery_address: requiredString.max(255).required().messages({
    'any.required': 'Delivery address is required',
  }),
  delivery_city: requiredString.max(100).required().messages({
    'any.required': 'City is required',
  }),
  delivery_district: requiredString.max(100).required().messages({
    'any.required': 'District is required',
  }),
  delivery_state: requiredString.max(100).required().messages({
    'any.required': 'State is required',
  }),
  delivery_pincode: Joi.string()
    .trim()
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      'string.pattern.base': 'Pincode must be a 6-digit postal code',
      'any.required': 'Pincode is required',
    }),
  items: Joi.array()
    .items(
      Joi.object({
        product_id: uuidSchema.required().messages({
          'string.guid': 'Valid product UUID is required',
          'any.required': 'Product ID is required',
        }),
        quantity: Joi.number().integer().min(1).required().messages({
          'number.min': 'Quantity must be at least 1',
          'any.required': 'Quantity is required',
        }),
      })
    )
    .min(1)
    .optional(),
});

export const updateOrderStatusSchema = Joi.object({
  order_status: Joi.string()
    .valid(...Object.values(ORDER_STATUS))
    .required()
    .messages({
      'any.only': `Order status must be one of: ${Object.values(ORDER_STATUS).join(', ')}`,
      'any.required': 'Order status is required',
    }),
});

export const queryOrdersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string()
    .valid(...Object.values(ORDER_STATUS))
    .optional(),
});
