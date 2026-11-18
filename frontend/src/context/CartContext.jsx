// src/context/CartContext.jsx
// Global cart state connected to backend cart APIs

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated, isBuyer } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch cart when user logs in as buyer
  const fetchCart = useCallback(async () => {
    if (!isAuthenticated || !isBuyer) {
      setItems([]);
      return;
    }
    try {
      setLoading(true);
      const res = await cartService.getCart();
      const cartData = res?.data;
      if (Array.isArray(cartData)) {
        setItems(cartData);
      } else if (cartData?.items && Array.isArray(cartData.items)) {
        setItems(cartData.items);
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isBuyer]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = useCallback(async (productId, quantity = 1) => {
    const result = await cartService.addToCart(productId, quantity);
    await fetchCart();
    return result;
  }, [fetchCart]);

  const updateItem = useCallback(async (itemId, quantity) => {
    const result = await cartService.updateCartItem(itemId, quantity);
    await fetchCart();
    return result;
  }, [fetchCart]);

  const removeItem = useCallback(async (itemId) => {
    const result = await cartService.removeFromCart(itemId);
    await fetchCart();
    return result;
  }, [fetchCart]);

  const clearCart = useCallback(async () => {
    try {
      await cartService.clearCart();
    } catch {
      // Ignore
    } finally {
      setItems([]);
    }
  }, []);

  const cartCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  const cartTotal = items.reduce((sum, item) => {
    const price = Number(item.product?.price || item.unit_price || 0);
    const qty = Number(item.quantity) || 1;
    return sum + (price * qty);
  }, 0);

  return (
    <CartContext.Provider value={{
      items,
      loading,
      cartCount,
      cartTotal,
      addToCart,
      updateItem,
      removeItem,
      clearCart,
      refetch: fetchCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
