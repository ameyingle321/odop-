// src/services/reviewService.js
// Review API calls aligned with backend review endpoints

import api from '../lib/axios';

export const reviewService = {
  /**
   * Get public reviews and ratings summary for a product
   */
  async getProductReviews(productId, params = {}) {
    const { data } = await api.get(`/products/${productId}/reviews`, { params });
    return data;
  },

  /**
   * Submit a verified review for a delivered order
   */
  async createReview(productId, { order_id, rating, comment }) {
    const { data } = await api.post(`/products/${productId}/reviews`, {
      order_id,
      rating: Number(rating),
      comment: comment?.trim() || null,
    });
    return data;
  },

  /**
   * Get current authenticated buyer's own reviews
   */
  async getMyReviews() {
    const { data } = await api.get('/reviews/my');
    return data;
  },

  /**
   * Delete own review
   */
  async deleteReview(id) {
    const { data } = await api.delete(`/reviews/${id}`);
    return data;
  },
};
