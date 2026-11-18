/**
 * Seller controller.
 *
 * Thin controller layer delegating to seller and product services.
 *
 * See: Development Rules §9 — Controllers
 */

import * as sellerService from '../services/seller.service.js';
import * as productService from '../services/product.service.js';
import { catchAsync, sendSuccess } from '../utils/index.js';
import { HTTP } from '../constants/index.js';

/**
 * GET /api/seller/profile
 * Get authenticated seller's profile.
 */
export const getProfile = catchAsync(async (req, res) => {
  const profile = await sellerService.getSellerProfile(req.user.id);
  sendSuccess(res, profile);
});

/**
 * PUT /api/seller/profile
 * Update authenticated seller's profile.
 */
export const updateProfile = catchAsync(async (req, res) => {
  const updated = await sellerService.updateSellerProfile(req.user.id, req.body);
  sendSuccess(res, updated, HTTP.OK, 'Seller profile updated successfully.');
});

/**
 * GET /api/seller/dashboard
 * Get seller dashboard metrics and recent products.
 */
export const getDashboard = catchAsync(async (req, res) => {
  const dashboard = await sellerService.getSellerDashboard(req.user.id);
  sendSuccess(res, dashboard);
});

/**
 * GET /api/seller/products
 * Get paginated list of products owned by the authenticated seller.
 */
export const getProducts = catchAsync(async (req, res) => {
  const result = await productService.getSellerProducts(req.user.id, req.query);
  sendSuccess(res, result);
});
