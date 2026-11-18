// src/services/productService.js
// Product, Category & District API calls with response normalization

import api from '../lib/axios';

export const productService = {
  /**
   * Get all products with query filters (search, district, category, price, sort)
   */
  async getProducts(params = {}) {
    const query = { ...params };

    // Format sort parameter (e.g. 'price:asc' -> sort_by='price', sort_order='asc')
    if (query.sort && typeof query.sort === 'string' && query.sort.includes(':')) {
      const [by, order] = query.sort.split(':');
      query.sort_by = by;
      query.sort_order = order;
      delete query.sort;
    }

    // Map camelCase to snake_case for backend validation
    if (query.minPrice !== undefined) {
      query.min_price = query.minPrice;
      delete query.minPrice;
    }
    if (query.maxPrice !== undefined) {
      query.max_price = query.maxPrice;
      delete query.maxPrice;
    }
    if (query.district) {
      query.district_id = query.district;
    }
    if (query.category) {
      query.category_id = query.category;
    }

    // Clean empty values
    Object.keys(query).forEach((key) => {
      if (query[key] === '' || query[key] === null || query[key] === undefined) {
        delete query[key];
      }
    });

    const { data } = await api.get('/products', { params: query });
    return data;
  },

  /**
   * Get single product details by UUID or slug
   */
  async getProductById(id) {
    const { data } = await api.get(`/products/${id}`);
    return data;
  },

  /**
   * Get list of ODOP districts
   */
  async getDistricts(params = {}) {
    const { data } = await api.get('/districts', { params });
    const list = data?.data?.districts || (Array.isArray(data?.data) ? data.data : []);
    return { ...data, data: list };
  },

  /**
   * Get list of product categories
   */
  async getCategories(params = {}) {
    const { data } = await api.get('/categories', { params });
    const list = data?.data?.categories || (Array.isArray(data?.data) ? data.data : []);
    return { ...data, data: list };
  },

  /**
   * Get seller's own products
   */
  async getMyProducts(params = {}) {
    const { data } = await api.get('/seller/products', { params });
    return data;
  },

  /**
   * Create a new product (seller only)
   */
  async createProduct(productData) {
    const { data } = await api.post('/products', productData);
    return data;
  },

  /**
   * Update a product (seller only)
   */
  async updateProduct(id, productData) {
    const { data } = await api.put(`/products/${id}`, productData);
    return data;
  },

  /**
   * Delete or deactivate a product (seller only)
   */
  async deleteProduct(id) {
    const { data } = await api.delete(`/products/${id}`);
    return data;
  },
};
