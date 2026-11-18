/**
 * Product-related Joi validation schemas.
 *
 * Enforces field requirements, data types, and status constraints
 * for product creation, updates, and filtering.
 */

import Joi from 'joi';
import { uuidSchema, requiredString, priceSchema, quantitySchema } from './common.validator.js';
import { PRODUCT_STATUS } from '../constants/productStatuses.js';

/**
 * Schema for an individual product image.
 */
const productImageSchema = Joi.alternatives().try(
  Joi.string().uri().trim(),
  Joi.object({
    image_url: Joi.string().uri().trim().required(),
    display_order: Joi.number().integer().min(0).default(0),
  }),
);

/**
 * POST /api/products — Create Product
 */
export const createProductSchema = Joi.object({
  name: requiredString.max(200).required(),
  description: Joi.string().trim().max(2000).allow('', null).optional(),
  price: priceSchema.required(),
  stock: quantitySchema.default(0),
  category_id: uuidSchema.required(),
  district_id: uuidSchema.optional(), // If omitted, defaults to seller's registered district
  status: Joi.string()
    .valid(PRODUCT_STATUS.DRAFT, PRODUCT_STATUS.ACTIVE, PRODUCT_STATUS.INACTIVE)
    .default(PRODUCT_STATUS.ACTIVE),
  odop_product_name: Joi.string().trim().max(200).allow('', null).optional(),
  images: Joi.array().items(productImageSchema).max(10).default([]),
});

/**
 * PUT /api/products/:id — Update Product
 */
export const updateProductSchema = Joi.object({
  name: requiredString.max(200).optional(),
  description: Joi.string().trim().max(2000).allow('', null).optional(),
  price: priceSchema.optional(),
  stock: quantitySchema.optional(),
  category_id: uuidSchema.optional(),
  district_id: uuidSchema.optional(),
  status: Joi.string()
    .valid(PRODUCT_STATUS.DRAFT, PRODUCT_STATUS.ACTIVE, PRODUCT_STATUS.INACTIVE, PRODUCT_STATUS.REJECTED)
    .optional(),
  odop_product_name: Joi.string().trim().max(200).allow('', null).optional(),
  images: Joi.array().items(productImageSchema).max(10).optional(),
}).min(1);

/**
 * Query schema for listing seller products
 */
export const listSellerProductsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string()
    .valid(PRODUCT_STATUS.DRAFT, PRODUCT_STATUS.ACTIVE, PRODUCT_STATUS.INACTIVE, PRODUCT_STATUS.REJECTED)
    .optional(),
  sort_by: Joi.string().valid('created_at', 'price', 'name', 'stock').default('created_at'),
  sort_order: Joi.string().valid('asc', 'desc').default('desc'),
});

/**
 * Public catalog & search query schema
 * Supports product-first discovery and multiple filters
 */
export const searchProductsSchema = Joi.object({
  search: Joi.string().trim().max(100).allow('', null).optional(),
  category_id: uuidSchema.optional(),
  category: Joi.string().trim().max(100).optional(),
  district_id: uuidSchema.optional(),
  district: Joi.string().trim().max(100).optional(),
  min_price: Joi.number().min(0).optional(),
  max_price: Joi.number().min(0).optional(),
  in_stock: Joi.boolean().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort_by: Joi.string().valid('created_at', 'price', 'name', 'stock').default('created_at'),
  sort_order: Joi.string().valid('asc', 'desc').default('desc'),
});

