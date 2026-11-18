// src/services/authService.js
// Auth API calls connected to backend Express + Supabase Auth

import api from '../lib/axios';

export const authService = {
  /**
   * Register a new user (buyer or seller)
   */
  async register({ name, email, password, phone, role = 'buyer', business_name, district_id, address, state }) {
    if (role === 'seller') {
      const { data } = await api.post('/auth/register/seller', {
        name,
        email,
        password,
        phone: phone || undefined,
        business_name,
        district_id,
        address,
        state: state || 'Uttar Pradesh',
      });
      return data;
    }

    const { data } = await api.post('/auth/register', {
      name,
      email,
      password,
      phone: phone || undefined,
    });
    return data;
  },

  /**
   * Login with email and password
   */
  async login({ email, password }) {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },

  /**
   * Get current authenticated user profile
   */
  async getMe() {
    const { data } = await api.get('/auth/profile');
    return data;
  },

  /**
   * Logout session
   */
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('odop_token');
      localStorage.removeItem('odop_user');
    }
  },

  /**
   * Update profile
   */
  async updateProfile(profileData) {
    const { data } = await api.put('/auth/profile', profileData);
    return data;
  },
};
