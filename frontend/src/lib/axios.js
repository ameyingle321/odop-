// src/lib/axios.js
// Centralized Axios instance for all API calls

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor — attach auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('odop_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('odop_token');
      localStorage.removeItem('odop_user');

      // Only redirect if currently on a protected route
      const publicPaths = ['/', '/login', '/register', '/products'];
      const isPublic = publicPaths.some(p => 
        window.location.pathname === p || window.location.pathname.startsWith('/products/')
      );
      if (!isPublic && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
