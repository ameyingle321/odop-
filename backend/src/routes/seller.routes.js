/**
 * Seller routes.
 *
 * Endpoints:
 *   GET /api/seller/profile    — Get authenticated seller profile
 *   PUT /api/seller/profile    — Update seller profile
 *   GET /api/seller/dashboard  — Get dashboard statistics and overview
 *   GET /api/seller/products   — Get paginated products for this seller
 *
 * All endpoints require: authenticate, authorize(ROLES.SELLER)
 */

import { Router } from 'express';
import * as sellerController from '../controllers/seller.controller.js';
import * as orderController from '../controllers/order.controller.js';
import authenticate from '../middleware/auth.middleware.js';
import authorize from '../middleware/role.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { ROLES } from '../constants/index.js';
import {
  updateSellerProfileSchema,
  listSellerProductsSchema,
  queryOrdersSchema,
  updateOrderStatusSchema,
} from '../validators/index.js';

const router = Router();

// All /seller routes require authentication and SELLER role
router.use('/seller', authenticate, authorize(ROLES.SELLER));

router.get('/seller/profile', sellerController.getProfile);
router.put('/seller/profile', validate(updateSellerProfileSchema), sellerController.updateProfile);
router.get('/seller/dashboard', sellerController.getDashboard);
router.get('/seller/products', validate(listSellerProductsSchema, 'query'), sellerController.getProducts);

// Order fulfillment for seller's products
router.get('/seller/orders', validate(queryOrdersSchema, 'query'), orderController.getSellerOrders);
router.get('/seller/orders/:id', orderController.getSellerOrderById);
router.patch('/seller/orders/:id/status', validate(updateOrderStatusSchema), orderController.updateOrderStatus);

export default router;
