/**
 * Order Controller.
 *
 * Handles HTTP requests for buyer checkout/history and seller order fulfillment.
 *
 * See: TRD §14 — Order Processing, §16 — Order Status Model
 */

import * as orderService from '../services/order.service.js';
import { catchAsync, sendSuccess } from '../utils/index.js';
import { HTTP } from '../constants/index.js';

/**
 * POST /api/orders
 * Create a new order (from cart or items).
 */
export const createOrder = catchAsync(async (req, res) => {
  const order = await orderService.createOrder(req.user.id, req.body);
  sendSuccess(res, order, HTTP.CREATED, 'Order placed successfully');
});

/**
 * GET /api/orders
 * Get orders for authenticated buyer.
 */
export const getBuyerOrders = catchAsync(async (req, res) => {
  const result = await orderService.getBuyerOrders(req.user.id, req.query);
  sendSuccess(res, result, HTTP.OK, 'Buyer orders retrieved successfully');
});

/**
 * GET /api/orders/:id
 * Get single order details for authenticated buyer.
 */
export const getBuyerOrderById = catchAsync(async (req, res) => {
  const order = await orderService.getBuyerOrderById(req.user.id, req.params.id);
  sendSuccess(res, order, HTTP.OK, 'Order details retrieved successfully');
});

/**
 * GET /api/seller/orders
 * Get orders containing items fulfilled by authenticated seller.
 */
export const getSellerOrders = catchAsync(async (req, res) => {
  const result = await orderService.getSellerOrders(req.user.id, req.query);
  sendSuccess(res, result, HTTP.OK, 'Seller orders retrieved successfully');
});

/**
 * GET /api/seller/orders/:id
 * Get single order details for seller (only includes items fulfilled by seller).
 */
export const getSellerOrderById = catchAsync(async (req, res) => {
  const order = await orderService.getSellerOrderById(req.user.id, req.params.id);
  sendSuccess(res, order, HTTP.OK, 'Seller order details retrieved successfully');
});

/**
 * PATCH /api/orders/:id/status
 * Update order status (buyer cancel, or seller/admin progress).
 */
export const updateOrderStatus = catchAsync(async (req, res) => {
  const actor = {
    userId: req.user.id,
    role: req.user.role,
  };
  const updated = await orderService.updateOrderStatus(
    req.params.id,
    req.body.order_status,
    actor
  );
  sendSuccess(res, updated, HTTP.OK, 'Order status updated successfully');
});
