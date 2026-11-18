/**
 * Product routes.
 *
 * Endpoints:
 *   POST   /api/products      — Create product (Seller only)
 *   GET    /api/products/:id  — Get product details (Public)
 *   PUT    /api/products/:id  — Update product (Owning seller only)
 *   DELETE /api/products/:id  — Delete/deactivate product (Owning seller only)
 *
 * Enforces:
 *   - Seller District = Product District
 *   - Seller Ownership validation
 */

import { Router } from 'express';
import * as productController from '../controllers/product.controller.js';
import authenticate from '../middleware/auth.middleware.js';
import authorize from '../middleware/role.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { ROLES } from '../constants/index.js';
import {
  createProductSchema,
  updateProductSchema,
  searchProductsSchema,
} from '../validators/index.js';

const router = Router();

// --- Public endpoints ---
router.get('/products', validate(searchProductsSchema, 'query'), productController.listProducts);
router.get('/products/:id', productController.getProduct);

// --- Seller endpoints ---
router.post(
  '/products',
  authenticate,
  authorize(ROLES.SELLER),
  validate(createProductSchema),
  productController.createProduct,
);

router.put(
  '/products/:id',
  authenticate,
  authorize(ROLES.SELLER),
  validate(updateProductSchema),
  productController.updateProduct,
);

router.delete(
  '/products/:id',
  authenticate,
  authorize(ROLES.SELLER),
  productController.deleteProduct,
);

export default router;
