/**
 * Order routes.
 *
 * Endpoints:
 *   POST   /api/orders             — Place a new order (from cart or direct)
 *   GET    /api/orders             — List authenticated buyer's orders
 *   GET    /api/orders/:id         — Get single order details
 *   PATCH  /api/orders/:id/status  — Update order status (e.g. buyer cancellation)
 *
 * All order endpoints require authentication.
 */

import { Router } from 'express';
import * as orderController from '../controllers/order.controller.js';
import authenticate from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  queryOrdersSchema,
} from '../validators/index.js';

const router = Router();

// Order operations require authentication
router.use('/orders', authenticate);

router.post('/orders', validate(createOrderSchema), orderController.createOrder);
router.get('/orders', validate(queryOrdersSchema, 'query'), orderController.getBuyerOrders);
router.get('/orders/:id', orderController.getBuyerOrderById);
router.patch('/orders/:id/status', validate(updateOrderStatusSchema), orderController.updateOrderStatus);

export default router;
