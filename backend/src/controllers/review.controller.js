/**
 * Review Controller.
 *
 * Handles HTTP requests for submitting and reading verified product reviews.
 *
 * See: TRD §17 — Review System
 */

import * as reviewService from '../services/review.service.js';
import { catchAsync, sendSuccess } from '../utils/index.js';
import { HTTP } from '../constants/index.js';

/**
 * POST /api/products/:productId/reviews
 * Submit a verified product review.
 */
export const createReview = catchAsync(async (req, res) => {
  const productId = req.params.productId || req.params.id;
  const review = await reviewService.createReview(
    req.user.id,
    productId,
    req.body
  );
  sendSuccess(res, review, HTTP.CREATED, 'Review submitted successfully');
});

/**
 * GET /api/products/:productId/reviews
 * Get public reviews and ratings summary for a product.
 */
export const getProductReviews = catchAsync(async (req, res) => {
  const productId = req.params.productId || req.params.id;
  const result = await reviewService.getProductReviews(
    productId,
    req.query
  );
  sendSuccess(res, result, HTTP.OK, 'Product reviews retrieved successfully');
});

/**
 * GET /api/reviews/my
 * Get all reviews written by authenticated buyer.
 */
export const getBuyerReviews = catchAsync(async (req, res) => {
  const reviews = await reviewService.getBuyerReviews(req.user.id);
  sendSuccess(res, reviews, HTTP.OK, 'Buyer reviews retrieved successfully');
});

/**
 * DELETE /api/reviews/:id
 * Delete a review written by the authenticated buyer.
 */
export const deleteReview = catchAsync(async (req, res) => {
  await reviewService.deleteReview(req.user.id, req.params.id);
  sendSuccess(res, null, HTTP.OK, 'Review deleted successfully');
});
