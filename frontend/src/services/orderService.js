// src/services/orderService.js
// Order API calls connected to backend order routes

import api from '../lib/axios';

export const orderService = {
  /**
   * Create an order (from cart or specified items)
   */
  async createOrder(orderPayload) {
    // Flatten address fields if passed inside a nested shipping_address object
    const payload = { ...orderPayload };
    if (payload.shipping_address) {
      const addr = payload.shipping_address;
      payload.delivery_name     = addr.delivery_name || addr.full_name || addr.name;
      payload.delivery_phone    = addr.delivery_phone || addr.phone;
      payload.delivery_address  = addr.delivery_address || addr.address_line || addr.address;
      payload.delivery_city     = addr.delivery_city || addr.city;
      payload.delivery_district = addr.delivery_district || addr.district || addr.city;
      payload.delivery_state    = addr.delivery_state || addr.state || 'Uttar Pradesh';
      payload.delivery_pincode  = addr.delivery_pincode || addr.pincode;
      delete payload.shipping_address;
    }

    const { data } = await api.post('/orders', payload);
    return data;
  },

  /**
   * Get all orders for the authenticated buyer
   */
  async getMyOrders(params = {}) {
    const { data } = await api.get('/orders', { params });
    return data;
  },

  /**
   * Get a single buyer order by UUID
   */
  async getOrderById(id) {
    const { data } = await api.get(`/orders/${id}`);
    return data;
  },

  /**
   * Cancel an order (buyer)
   */
  async cancelOrder(id) {
    const { data } = await api.patch(`/orders/${id}/status`, {
      order_status: 'cancelled',
    });
    return data;
  },

  /**
   * Get orders for products sold by the authenticated seller
   */
  async getSellerOrders(params = {}) {
    const { data } = await api.get('/seller/orders', { params });
    return data;
  },

  /**
   * Get seller order details
   */
  async getSellerOrderById(id) {
    const { data } = await api.get(`/seller/orders/${id}`);
    return data;
  },

  /**
   * Update order fulfillment status (seller)
   */
  async updateOrderStatus(id, status) {
    const { data } = await api.patch(`/seller/orders/${id}/status`, {
      order_status: status,
    });
    return data;
  },
};
