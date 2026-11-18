/**
 * Cart Controller.
 *
 * Handles HTTP requests for buyer cart management.
 *
 * See: TRD §13 — Cart System
 */

import * as cartService from '../services/cart.service.js';
import { catchAsync, sendSuccess } from '../utils/index.js';
import { HTTP } from '../constants/index.js';

/**
 * GET /api/cart
 * Get current authenticated user's cart.
 */
export const getCart = catchAsync(async (req, res) => {
  const cart = await cartService.getCart(req.user.id);
  sendSuccess(res, cart, HTTP.OK, 'Cart retrieved successfully');
});

/**
 * POST /api/cart/items
 * Add an item to the user's cart.
 */
export const addToCart = catchAsync(async (req, res) => {
  const result = await cartService.addToCart(req.user.id, req.body);
  sendSuccess(res, result, HTTP.CREATED, 'Item added to cart');
});

/**
 * PUT /api/cart/items/:id
 * Update quantity of a cart item.
 */
export const updateCartItem = catchAsync(async (req, res) => {
  const result = await cartService.updateCartItem(
    req.user.id,
    req.params.id,
    req.body.quantity
  );
  sendSuccess(res, result, HTTP.OK, 'Cart item updated successfully');
});

/**
 * DELETE /api/cart/items/:id
 * Remove an item from the cart.
 */
export const removeCartItem = catchAsync(async (req, res) => {
  const updatedCart = await cartService.removeCartItem(req.user.id, req.params.id);
  sendSuccess(res, updatedCart, HTTP.OK, 'Item removed from cart');
});

/**
 * DELETE /api/cart
 * Clear entire cart.
 */
export const clearCart = catchAsync(async (req, res) => {
  await cartService.clearCart(req.user.id);
  sendSuccess(res, { items: [], total_items: 0, subtotal: 0 }, HTTP.OK, 'Cart cleared successfully');
});
