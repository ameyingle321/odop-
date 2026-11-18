// src/context/AuthContext.jsx
// Global authentication state connected to Supabase Auth backend

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to normalize user object
  const formatUser = (userData) => {
    if (!userData) return null;
    return {
      ...userData,
      name: userData.name || userData.full_name || 'Artisan Partner',
    };
  };

  // On mount, restore session from localStorage and verify with backend
  useEffect(() => {
    const token = localStorage.getItem('odop_token');
    const storedUser = localStorage.getItem('odop_user');

    if (token && storedUser) {
      try {
        setUser(formatUser(JSON.parse(storedUser)));
      } catch {
        localStorage.removeItem('odop_user');
      }

      // Verify token with backend
      authService.getMe()
        .then((res) => {
          if (res?.data) {
            const freshUser = formatUser(res.data);
            setUser(freshUser);
            localStorage.setItem('odop_user', JSON.stringify(freshUser));
          }
        })
        .catch(() => {
          localStorage.removeItem('odop_token');
          localStorage.removeItem('odop_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (credentials) => {
    const result = await authService.login(credentials);
    if (result.success && result.data) {
      const token = result.data.session?.access_token || result.data.token;
      const formatted = formatUser(result.data.user);
      if (token) localStorage.setItem('odop_token', token);
      if (formatted) localStorage.setItem('odop_user', JSON.stringify(formatted));
      setUser(formatted);
    }
    return result;
  }, []);

  const register = useCallback(async (userData) => {
    const result = await authService.register(userData);
    if (result.success && result.data) {
      const token = result.data.session?.access_token || result.data.token;
      const formatted = formatUser(result.data.user);
      if (token) localStorage.setItem('odop_token', token);
      if (formatted) localStorage.setItem('odop_user', JSON.stringify(formatted));
      setUser(formatted);
    }
    return result;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    const formatted = formatUser(updatedUser);
    setUser(formatted);
    localStorage.setItem('odop_user', JSON.stringify(formatted));
  }, []);

  const isAuthenticated = !!user;
  const isBuyer  = user?.role === 'buyer';
  const isSeller = user?.role === 'seller';
  const isAdmin  = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated,
      isBuyer,
      isSeller,
      isAdmin,
      login,
      register,
      logout,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
