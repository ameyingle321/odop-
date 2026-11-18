/**
 * Review Service.
 *
 * Implements verified customer reviews and ratings:
 *   - Only buyers with DELIVERED orders containing the product can leave reviews
 *   - Rating bounded between 1 and 5
 *   - Unique constraint enforcement: one review per buyer, order, and product
 *   - Comprehensive rating summary and distribution breakdown
 *
 * See: TRD §17 — Review System
 */

import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/index.js';
import { HTTP, ORDER_STATUS } from '../constants/index.js';
import logger from '../utils/logger.js';

/**
 * Submit a verified product review.
 *
 * Enforces:
 *   1. Buyer purchased product
 *   2. Order belongs to buyer
 *   3. Order status = DELIVERED
 *   4. Exactly one review per (order, product, buyer)
 *
 * @param {string} buyerId - Authenticated buyer profile ID
 * @param {string} productId - Product UUID
 * @param {object} reviewData - { order_id, rating, comment }
 * @returns {Promise<object>} Created review record
 */
export async function createReview(buyerId, productId, reviewData) {
  const { order_id, rating, comment } = reviewData;

  // 1. Verify product exists
  const { data: product, error: prodErr } = await supabaseAdmin
    .from('products')
    .select('id, name')
    .eq('id', productId)
    .maybeSingle();

  if (prodErr || !product) {
    throw new AppError('Product not found', HTTP.NOT_FOUND);
  }

  // 2. Verify order exists and belongs to buyer
  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .select('id, buyer_id, order_status')
    .eq('id', order_id)
    .eq('buyer_id', buyerId)
    .maybeSingle();

  if (orderErr || !order) {
    throw new AppError('Order not found or does not belong to you', HTTP.NOT_FOUND);
  }

  // 3. Verify order status = DELIVERED (TRD §17)
  if (order.order_status !== ORDER_STATUS.DELIVERED) {
    throw new AppError(
      `Reviews can only be submitted for delivered orders (current order status: "${order.order_status}")`,
      HTTP.BAD_REQUEST
    );
  }

  // 4. Verify product was purchased in this specific order
  const { data: orderItem, error: itemErr } = await supabaseAdmin
    .from('order_items')
    .select('id')
    .eq('order_id', order_id)
    .eq('product_id', productId)
    .limit(1)
    .maybeSingle();

  if (itemErr || !orderItem) {
    throw new AppError('This product was not purchased in the specified order', HTTP.BAD_REQUEST);
  }

  // 5. Verify no duplicate review for this (order, product, buyer)
  const { data: existingReview } = await supabaseAdmin
    .from('reviews')
    .select('id')
    .eq('order_id', order_id)
    .eq('product_id', productId)
    .eq('buyer_id', buyerId)
    .maybeSingle();

  if (existingReview) {
    throw new AppError('You have already submitted a review for this product from this order', HTTP.CONFLICT);
  }

  // 6. Insert review
  const { data: review, error: insertErr } = await supabaseAdmin
    .from('reviews')
    .insert({
      product_id: productId,
      buyer_id: buyerId,
      order_id: order_id,
      rating,
      comment: comment ? comment.trim() : null,
    })
    .select(`
      id,
      product_id,
      buyer_id,
      order_id,
      rating,
      comment,
      created_at,
      updated_at,
      profiles:buyer_id (id, full_name)
    `)
    .single();

  if (insertErr || !review) {
    logger.error('Failed to create review', { insertErr, buyerId, productId, order_id });
    throw new AppError('Failed to submit review', HTTP.INTERNAL_SERVER_ERROR);
  }

  logger.info('Product review created', { reviewId: review.id, productId, buyerId, rating });

  return review;
}

/**
 * Fetch reviews and ratings summary for a product.
 *
 * @param {string} productId - Product UUID
 * @param {object} query - { page, limit, rating }
 * @returns {Promise<object>} Paginated reviews and ratings summary
 */
export async function getProductReviews(productId, query = {}) {
  // Verify product exists
  const { data: product, error: prodErr } = await supabaseAdmin
    .from('products')
    .select('id, name')
    .eq('id', productId)
    .maybeSingle();

  if (prodErr || !product) {
    throw new AppError('Product not found', HTTP.NOT_FOUND);
  }

  const page = parseInt(query.page, 10) || 1;
  const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
  const offset = (page - 1) * limit;

  // 1. Fetch all reviews for this product to compute aggregate metrics
  const { data: allReviews, error: allErr } = await supabaseAdmin
    .from('reviews')
    .select('rating')
    .eq('product_id', productId);

  if (allErr) {
    logger.error('Failed to fetch product review summary', { allErr, productId });
    throw new AppError('Failed to fetch reviews', HTTP.INTERNAL_SERVER_ERROR);
  }

  const totalReviews = allReviews ? allReviews.length : 0;
  let totalRatingSum = 0;
  const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (const r of allReviews || []) {
    totalRatingSum += r.rating;
    if (ratingBreakdown[r.rating] !== undefined) {
      ratingBreakdown[r.rating]++;
    }
  }

  const averageRating = totalReviews > 0
    ? Math.round((totalRatingSum / totalReviews) * 10) / 10
    : 0;

  // 2. Fetch paginated list
  let listQuery = supabaseAdmin
    .from('reviews')
    .select(`
      id,
      product_id,
      buyer_id,
      order_id,
      rating,
      comment,
      created_at,
      updated_at,
      profiles:buyer_id (id, full_name)
    `, { count: 'exact' })
    .eq('product_id', productId)
    .order('created_at', { ascending: false });

  if (query.rating) {
    listQuery = listQuery.eq('rating', parseInt(query.rating, 10));
  }

  listQuery = listQuery.range(offset, offset + limit - 1);

  const { data: reviews, count, error: listErr } = await listQuery;

  if (listErr) {
    logger.error('Failed to fetch product reviews list', { listErr, productId });
    throw new AppError('Failed to fetch reviews', HTTP.INTERNAL_SERVER_ERROR);
  }

  return {
    reviews: reviews || [],
    summary: {
      average_rating: averageRating,
      total_reviews: totalReviews,
      rating_breakdown: ratingBreakdown,
    },
    pagination: {
      total: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit),
    },
  };
}

/**
 * Fetch all reviews written by a buyer.
 *
 * @param {string} buyerId - Authenticated buyer profile ID
 * @returns {Promise<Array>} List of reviews with product details
 */
export async function getBuyerReviews(buyerId) {
  const { data: reviews, error } = await supabaseAdmin
    .from('reviews')
    .select(`
      id,
      product_id,
      order_id,
      rating,
      comment,
      created_at,
      updated_at,
      products:product_id (id, name, slug, price)
    `)
    .eq('buyer_id', buyerId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Failed to fetch buyer reviews', { error, buyerId });
    throw new AppError('Failed to fetch your reviews', HTTP.INTERNAL_SERVER_ERROR);
  }

  return reviews || [];
}

/**
 * Delete a review written by the authenticated buyer.
 *
 * @param {string} buyerId - Authenticated buyer profile ID
 * @param {string} reviewId - Review UUID
 * @returns {Promise<void>}
 */
export async function deleteReview(buyerId, reviewId) {
  const { data: review, error: findErr } = await supabaseAdmin
    .from('reviews')
    .select('id, buyer_id')
    .eq('id', reviewId)
    .maybeSingle();

  if (findErr || !review) {
    throw new AppError('Review not found', HTTP.NOT_FOUND);
  }

  if (review.buyer_id !== buyerId) {
    throw new AppError('You do not have permission to delete this review', HTTP.FORBIDDEN);
  }

  const { error: delErr } = await supabaseAdmin
    .from('reviews')
    .delete()
    .eq('id', reviewId);

  if (delErr) {
    logger.error('Failed to delete review', { delErr, reviewId });
    throw new AppError('Failed to delete review', HTTP.INTERNAL_SERVER_ERROR);
  }
}
