// src/App.jsx
// Application root with router, context providers and all routes

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute, GuestRoute } from './routes/ProtectedRoute';

// Layouts
import MainLayout from './layouts/MainLayout';

// Public pages
import HomePage         from './pages/public/HomePage';
import ProductsPage     from './pages/public/ProductsPage';
import ProductDetailPage from './pages/public/ProductDetailPage';

// Auth pages
import LoginPage    from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Buyer pages
import CartPage        from './pages/buyer/CartPage';
import CheckoutPage    from './pages/buyer/CheckoutPage';
import OrdersPage      from './pages/buyer/OrdersPage';
import OrderDetailPage  from './pages/buyer/OrderDetailPage';

// Seller pages
import SellerDashboardPage from './pages/seller/SellerDashboardPage';
import SellerProductsPage  from './pages/seller/SellerProductsPage';
import SellerOrdersPage    from './pages/seller/SellerOrdersPage';

// Misc
import NotFoundPage from './pages/NotFoundPage';

function AppRoutes() {
  return (
    <Routes>
      {/* ── Public layout routes ── */}
      <Route element={<MainLayout />}>
        <Route path="/"             element={<HomePage />} />
        <Route path="/products"     element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />

        {/* ── Auth routes (guest only) ── */}
        <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

        {/* ── Buyer protected routes ── */}
        <Route path="/cart"       element={<ProtectedRoute requiredRole="buyer"><CartPage /></ProtectedRoute>} />
        <Route path="/checkout"   element={<ProtectedRoute requiredRole="buyer"><CheckoutPage /></ProtectedRoute>} />
        <Route path="/orders"     element={<ProtectedRoute requiredRole="buyer"><OrdersPage /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute requiredRole="buyer"><OrderDetailPage /></ProtectedRoute>} />

        {/* ── Seller protected routes ── */}
        <Route path="/seller/dashboard" element={<ProtectedRoute requiredRole="seller"><SellerDashboardPage /></ProtectedRoute>} />
        <Route path="/seller/products"  element={<ProtectedRoute requiredRole="seller"><SellerProductsPage /></ProtectedRoute>} />
        <Route path="/seller/orders"    element={<ProtectedRoute requiredRole="seller"><SellerOrdersPage /></ProtectedRoute>} />

        {/* ── 404 ── */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
