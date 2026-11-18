-- =============================================
-- ODOP Nexus — Migration 003: Row Level Security
-- =============================================
-- Enables RLS on all tables and creates policies.
-- Follows: Database Implementation §21-22
-- =============================================

-- ===== ENABLE RLS ON ALL TABLES =====
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;


-- =============================================================
-- PROFILES POLICIES
-- Users can read/update their own profile.
-- Insert handled by auth trigger (SECURITY DEFINER).
-- =============================================================

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow the auth trigger to insert profiles
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);


-- =============================================================
-- DISTRICTS POLICIES
-- Everyone can read active districts (reference data).
-- Modification is admin-only (service-role key bypasses RLS).
-- =============================================================

CREATE POLICY "districts_select_active" ON public.districts
  FOR SELECT USING (is_active = true);


-- =============================================================
-- CATEGORIES POLICIES
-- Everyone can read active categories (reference data).
-- Modification is admin-only (service-role key bypasses RLS).
-- =============================================================

CREATE POLICY "categories_select_active" ON public.categories
  FOR SELECT USING (is_active = true);


-- =============================================================
-- SELLER PROFILES POLICIES
-- Sellers can manage their own profile.
-- Public can read approved seller info (for product pages).
-- =============================================================

CREATE POLICY "seller_profiles_select_own" ON public.seller_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "seller_profiles_select_approved" ON public.seller_profiles
  FOR SELECT USING (verification_status = 'approved');

CREATE POLICY "seller_profiles_insert_own" ON public.seller_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "seller_profiles_update_own" ON public.seller_profiles
  FOR UPDATE USING (user_id = auth.uid());


-- =============================================================
-- PRODUCTS POLICIES
-- Anyone can read active products.
-- Sellers can manage their own products (any status).
-- =============================================================

CREATE POLICY "products_select_active" ON public.products
  FOR SELECT USING (status = 'active');

CREATE POLICY "products_select_own" ON public.products
  FOR SELECT USING (
    seller_id IN (
      SELECT id FROM public.seller_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "products_insert_own" ON public.products
  FOR INSERT WITH CHECK (
    seller_id IN (
      SELECT id FROM public.seller_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "products_update_own" ON public.products
  FOR UPDATE USING (
    seller_id IN (
      SELECT id FROM public.seller_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "products_delete_own" ON public.products
  FOR DELETE USING (
    seller_id IN (
      SELECT id FROM public.seller_profiles WHERE user_id = auth.uid()
    )
  );


-- =============================================================
-- PRODUCT IMAGES POLICIES
-- Anyone can view images of active products or own products.
-- Sellers can manage images for their own products.
-- =============================================================

CREATE POLICY "product_images_select" ON public.product_images
  FOR SELECT USING (
    product_id IN (SELECT id FROM public.products WHERE status = 'active')
    OR product_id IN (
      SELECT p.id FROM public.products p
      JOIN public.seller_profiles sp ON p.seller_id = sp.id
      WHERE sp.user_id = auth.uid()
    )
  );

CREATE POLICY "product_images_insert_own" ON public.product_images
  FOR INSERT WITH CHECK (
    product_id IN (
      SELECT p.id FROM public.products p
      JOIN public.seller_profiles sp ON p.seller_id = sp.id
      WHERE sp.user_id = auth.uid()
    )
  );

CREATE POLICY "product_images_update_own" ON public.product_images
  FOR UPDATE USING (
    product_id IN (
      SELECT p.id FROM public.products p
      JOIN public.seller_profiles sp ON p.seller_id = sp.id
      WHERE sp.user_id = auth.uid()
    )
  );

CREATE POLICY "product_images_delete_own" ON public.product_images
  FOR DELETE USING (
    product_id IN (
      SELECT p.id FROM public.products p
      JOIN public.seller_profiles sp ON p.seller_id = sp.id
      WHERE sp.user_id = auth.uid()
    )
  );


-- =============================================================
-- CART ITEMS POLICIES
-- Buyers can fully manage their own cart.
-- =============================================================

CREATE POLICY "cart_items_select_own" ON public.cart_items
  FOR SELECT USING (buyer_id = auth.uid());

CREATE POLICY "cart_items_insert_own" ON public.cart_items
  FOR INSERT WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "cart_items_update_own" ON public.cart_items
  FOR UPDATE USING (buyer_id = auth.uid());

CREATE POLICY "cart_items_delete_own" ON public.cart_items
  FOR DELETE USING (buyer_id = auth.uid());


-- =============================================================
-- ORDERS POLICIES
-- Buyers can read their own orders.
-- Sellers can read orders containing their products.
-- Order creation handled by backend (service-role).
-- =============================================================

CREATE POLICY "orders_select_buyer" ON public.orders
  FOR SELECT USING (buyer_id = auth.uid());

CREATE POLICY "orders_select_seller" ON public.orders
  FOR SELECT USING (
    id IN (
      SELECT DISTINCT oi.order_id FROM public.order_items oi
      JOIN public.seller_profiles sp ON oi.seller_id = sp.id
      WHERE sp.user_id = auth.uid()
    )
  );


-- =============================================================
-- ORDER ITEMS POLICIES
-- Buyers can read items from their own orders.
-- Sellers can read items they are responsible for fulfilling.
-- =============================================================

CREATE POLICY "order_items_select_buyer" ON public.order_items
  FOR SELECT USING (
    order_id IN (SELECT id FROM public.orders WHERE buyer_id = auth.uid())
  );

CREATE POLICY "order_items_select_seller" ON public.order_items
  FOR SELECT USING (
    seller_id IN (
      SELECT id FROM public.seller_profiles WHERE user_id = auth.uid()
    )
  );


-- =============================================================
-- PAYMENTS POLICIES
-- Buyers can view payment status for their own orders.
-- Payment creation/updates handled by backend (service-role).
-- =============================================================

CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT USING (
    order_id IN (SELECT id FROM public.orders WHERE buyer_id = auth.uid())
  );


-- =============================================================
-- REVIEWS POLICIES
-- Anyone can read reviews.
-- Buyers can create/update/delete their own reviews.
-- Review eligibility (delivered order) is enforced by the backend.
-- =============================================================

CREATE POLICY "reviews_select_all" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "reviews_insert_own" ON public.reviews
  FOR INSERT WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "reviews_update_own" ON public.reviews
  FOR UPDATE USING (buyer_id = auth.uid());

CREATE POLICY "reviews_delete_own" ON public.reviews
  FOR DELETE USING (buyer_id = auth.uid());
