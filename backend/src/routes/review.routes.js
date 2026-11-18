/**
 * Review Routes.
 *
 * Endpoints:
 *   POST   /api/products/:productId/reviews — Submit verified review for product
 *   GET    /api/products/:productId/reviews — Get public reviews and ratings summary
 *   GET    /api/reviews/my                  — Get current buyer's reviews
 *   DELETE /api/reviews/:id                 — Delete own review
 *
 * See: TRD §17 — Review System
 */

import { Router } from 'express';
import * as reviewController from '../controllers/review.controller.js';
import authenticate from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import {
  createReviewSchema,
  queryReviewsSchema,
} from '../validators/index.js';

const router = Router();

// Public product review retrieval
router.get(
  '/products/:productId/reviews',
  validate(queryReviewsSchema, 'query'),
  reviewController.getProductReviews
);

// Authenticated product review submission
router.post(
  '/products/:productId/reviews',
  authenticate,
  validate(createReviewSchema),
  reviewController.createReview
);

// Buyer review management
router.get('/reviews/my', authenticate, reviewController.getBuyerReviews);
router.delete('/reviews/:id', authenticate, reviewController.deleteReview);

export default router;
