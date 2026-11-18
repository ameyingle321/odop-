/**
 * Cart routes.
 *
 * Endpoints:
 *   GET    /api/cart            — Get current user's cart
 *   POST   /api/cart/items      — Add item to cart
 *   PUT    /api/cart/items/:id  — Update quantity of cart item
 *   DELETE /api/cart/items/:id  — Remove item from cart
 *   DELETE /api/cart            — Clear cart
 *
 * All cart endpoints require authentication.
 */

import { Router } from 'express';
import * as cartController from '../controllers/cart.controller.js';
import authenticate from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { addToCartSchema, updateCartItemSchema } from '../validators/index.js';

const router = Router();

// Cart is a personal user resource; all endpoints require authentication
router.use('/cart', authenticate);

router.get('/cart', cartController.getCart);
router.post('/cart/items', validate(addToCartSchema), cartController.addToCart);
router.put('/cart/items/:id', validate(updateCartItemSchema), cartController.updateCartItem);
router.delete('/cart/items/:id', cartController.removeCartItem);
router.delete('/cart', cartController.clearCart);

export default router;
