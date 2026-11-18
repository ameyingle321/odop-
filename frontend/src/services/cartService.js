// src/services/cartService.js
// Cart API calls matching backend cart endpoints

import api from '../lib/axios';

export const cartService = {
  /**
   * Get current authenticated user's cart
   */
  async getCart() {
    const { data } = await api.get('/cart');
    return data;
  },

  /**
   * Add item to cart
   */
  async addToCart(productId, quantity = 1) {
    const { data } = await api.post('/cart/items', {
      product_id: productId,
      quantity: Number(quantity),
    });
    return data;
  },

  /**
   * Update quantity of a cart item
   */
  async updateCartItem(itemId, quantity) {
    const { data } = await api.put(`/cart/items/${itemId}`, {
      quantity: Number(quantity),
    });
    return data;
  },

  /**
   * Remove item from cart
   */
  async removeFromCart(itemId) {
    const { data } = await api.delete(`/cart/items/${itemId}`);
    return data;
  },

  /**
   * Clear entire cart
   */
  async clearCart() {
    const { data } = await api.delete('/cart');
    return data;
  },
};
