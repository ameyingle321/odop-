/**
 * Product controller.
 *
 * Thin controller layer delegating to product service.
 *
 * See: Development Rules §9 — Controllers
 */

import * as productService from '../services/product.service.js';
import { catchAsync, sendSuccess } from '../utils/index.js';
import { HTTP } from '../constants/index.js';

/**
 * POST /api/products
 * Create a new product listing (Seller only).
 */
export const createProduct = catchAsync(async (req, res) => {
  const product = await productService.createProduct(req.user.id, req.body);
  sendSuccess(res, product, HTTP.CREATED, 'Product created successfully.');
});

/**
 * GET /api/products
 * Public catalog discovery & product search.
 */
export const listProducts = catchAsync(async (req, res) => {
  const result = await productService.searchProducts(req.query);
  sendSuccess(res, result);
});

/**
 * GET /api/products/:id
 * Get single product details by ID.
 */
export const getProduct = catchAsync(async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  sendSuccess(res, product);
});

/**
 * PUT /api/products/:id
 * Update an existing product (Owning seller only).
 */
export const updateProduct = catchAsync(async (req, res) => {
  const updated = await productService.updateProduct(req.params.id, req.user.id, req.body);
  sendSuccess(res, updated, HTTP.OK, 'Product updated successfully.');
});

/**
 * DELETE /api/products/:id
 * Delete or deactivate product (Owning seller only).
 */
export const deleteProduct = catchAsync(async (req, res) => {
  const result = await productService.deleteProduct(req.params.id, req.user.id);
  sendSuccess(res, null, HTTP.OK, result.message);
});
