-- ==============================================
-- ODOP Nexus — Combined Database Migration
-- ==============================================
-- Run this ENTIRE script in the Supabase SQL Editor.
-- It creates all tables, indexes, RLS, functions,
-- triggers, storage, and seed data for a fresh project.
--
-- Security fixes included:
--   - Role escalation prevention trigger
--   - District enforcement trigger (defense-in-depth)
--   - Ownership-based storage policies
-- ==============================================


-- ===== FILE: 001_schema.sql =====
-- =============================================
-- ODOP Nexus — Migration 001: Core Schema
-- =============================================
-- Creates all application tables with primary keys,
-- foreign keys, constraints, and CHECK constraints.
-- Follows: ODOP_Nexus_Supabase_Database_Implementation
-- =============================================

-- ===== PROFILES =====
-- Application-level user information.
-- id references auth.users(id) — the Supabase Auth identity.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'buyer'
    CHECK (role IN ('buyer', 'seller', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Application user profiles linked to Supabase Auth';
COMMENT ON COLUMN public.profiles.role IS 'User role: buyer, seller, or admin';

-- ===== DISTRICTS =====
-- Central reference for district-based product relationships.
-- District names are never stored as free text in products or sellers.
CREATE TABLE IF NOT EXISTS public.districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  odop_product_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.districts IS 'ODOP district reference data';

-- ===== CATEGORIES =====
-- Product category reference data.
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.categories IS 'Product category reference data';

-- ===== SELLER PROFILES =====
-- Extended profile for sellers. One seller per user, one district per seller.
CREATE TABLE IF NOT EXISTS public.seller_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  district_id UUID NOT NULL REFERENCES public.districts(id),
  state TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.seller_profiles IS 'Seller business profiles with district association';
COMMENT ON COLUMN public.seller_profiles.district_id IS 'The seller registered district — products must match this';

-- ===== PRODUCTS =====
-- CRITICAL: product.district_id must equal seller_profiles.district_id
-- This is enforced by backend business logic + database trigger.
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE,
  district_id UUID NOT NULL REFERENCES public.districts(id),
  category_id UUID NOT NULL REFERENCES public.categories(id),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'inactive', 'rejected')),
  odop_product_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.products IS 'Product listings — district_id MUST match seller district_id';

-- ===== PRODUCT IMAGES =====
-- One product can have multiple images. Stored in Supabase Storage.
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  storage_path TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.product_images IS 'Product image references — actual files in Supabase Storage';

-- ===== CART ITEMS =====
-- Buyer shopping cart. Unique constraint prevents duplicate product rows.
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(buyer_id, product_id)
);

COMMENT ON TABLE public.cart_items IS 'Buyer shopping cart with unique buyer+product constraint';

-- ===== ORDERS =====
-- Delivery address stored as snapshot — not dependent on buyer profile changes.
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES public.profiles(id),
  total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
  payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'authorized', 'paid', 'failed', 'refunded')),
  order_status TEXT NOT NULL DEFAULT 'pending_payment'
    CHECK (order_status IN ('pending_payment', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  delivery_name TEXT,
  delivery_phone TEXT,
  delivery_address TEXT,
  delivery_city TEXT,
  delivery_district TEXT,
  delivery_state TEXT,
  delivery_pincode TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.orders IS 'Customer orders with delivery address snapshot';

-- ===== ORDER ITEMS =====
-- Preserves product_name and unit_price as purchase-time snapshots.
-- Later product price changes do not alter historical orders.
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  seller_id UUID NOT NULL REFERENCES public.seller_profiles(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC NOT NULL CHECK (unit_price >= 0),
  subtotal NUMERIC NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.order_items IS 'Order line items with price snapshots at time of purchase';

-- ===== PAYMENTS =====
-- Payment records tied to orders. Verification must happen server-side.
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'razorpay',
  provider_order_id TEXT,
  provider_payment_id TEXT,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'authorized', 'paid', 'failed', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.payments IS 'Payment records — status must be verified server-side, never from frontend';

-- ===== REVIEWS =====
-- Requires: valid buyer + valid order + product in order + order delivered.
-- Unique constraint prevents duplicate reviews per order/product/buyer.
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id),
  order_id UUID NOT NULL REFERENCES public.orders(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(order_id, product_id, buyer_id)
);

COMMENT ON TABLE public.reviews IS 'Product reviews — only eligible buyers with delivered orders';


-- ===== FILE: 002_indexes.sql =====
-- =============================================
-- ODOP Nexus — Migration 002: Indexes
-- =============================================
-- Creates indexes for frequent queries.
-- Follows: Database Implementation §29-32
-- =============================================

-- === Product Indexes ===
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_district_id ON public.products(district_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);

-- === Seller Profile Indexes ===
CREATE INDEX IF NOT EXISTS idx_seller_profiles_user_id ON public.seller_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_profiles_district_id ON public.seller_profiles(district_id);

-- === Order Indexes ===
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

-- === Order Item Indexes ===
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_seller_id ON public.order_items(seller_id);

-- === Review Indexes ===
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_buyer_id ON public.reviews(buyer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON public.reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at);

-- === Cart Indexes ===
CREATE INDEX IF NOT EXISTS idx_cart_items_buyer_id ON public.cart_items(buyer_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items(product_id);

-- === Payment Indexes ===
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);

-- === Product Image Indexes ===
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);


-- ===== FILE: 003_rls_policies.sql =====
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
-- Role changes are blocked by the prevent_role_change trigger.
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


-- ===== FILE: 004_functions_triggers.sql =====
-- =============================================
-- ODOP Nexus — Migration 004: Functions & Triggers
-- =============================================
-- Creates:
--   1. Auto-create profile on user signup (auth trigger)
--   2. District validation function (callable by backend)
--   3. District enforcement trigger (database-level protection)
--   4. Role escalation prevention trigger
--   5. Auto-update updated_at triggers
-- Follows: Database Implementation §25, §27-28
-- =============================================


-- =============================================================
-- 1. AUTO-CREATE PROFILE ON SIGNUP
-- When a user registers through Supabase Auth, this trigger
-- automatically creates a row in public.profiles.
-- Default role: 'buyer'
-- =============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'buyer',
    now(),
    now()
  );
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- =============================================================
-- 2. DISTRICT VALIDATION FUNCTION (callable by backend)
-- The most important business rule in ODOP Nexus:
--   seller_profiles.district_id = products.district_id
--
-- This function is called by the backend service layer.
-- Primary enforcement remains in the backend.
-- =============================================================

CREATE OR REPLACE FUNCTION public.validate_seller_product_district(
  p_seller_id UUID,
  p_product_district_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_seller_district_id UUID;
BEGIN
  SELECT district_id INTO v_seller_district_id
  FROM public.seller_profiles
  WHERE id = p_seller_id;

  IF v_seller_district_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN v_seller_district_id = p_product_district_id;
END;
$$;

COMMENT ON FUNCTION public.validate_seller_product_district IS
  'Returns true only when the seller district matches the product district';


-- =============================================================
-- 3. DISTRICT ENFORCEMENT TRIGGER
-- Database-level defense-in-depth for the critical ODOP rule:
--   products.district_id MUST equal seller_profiles.district_id
--
-- This trigger fires on every INSERT and UPDATE on products.
-- It rejects the operation if the district_id does not match
-- the seller's registered district_id.
--
-- Designed to not block legitimate admin operations:
--   - Admin can still update other product fields freely
--   - Only rejects when district_id genuinely mismatches
--   - Service-role connections are NOT exempt (the invariant
--     must hold universally — there is never a valid reason
--     for a product to be in a different district than its seller)
-- =============================================================

CREATE OR REPLACE FUNCTION public.enforce_seller_product_district()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_seller_district_id UUID;
BEGIN
  SELECT district_id INTO v_seller_district_id
  FROM public.seller_profiles
  WHERE id = NEW.seller_id;

  IF v_seller_district_id IS NULL THEN
    RAISE EXCEPTION 'Invalid seller_id: no seller profile found for %', NEW.seller_id;
  END IF;

  IF v_seller_district_id IS DISTINCT FROM NEW.district_id THEN
    RAISE EXCEPTION 'District mismatch: seller registered in district %, product specifies district %. Seller and product must belong to the same district.',
      v_seller_district_id, NEW.district_id;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_seller_product_district IS
  'Trigger function: rejects INSERT/UPDATE on products when district_id does not match the seller district';

DROP TRIGGER IF EXISTS trg_enforce_seller_product_district ON public.products;

CREATE TRIGGER trg_enforce_seller_product_district
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_seller_product_district();


-- =============================================================
-- 4. ROLE ESCALATION PREVENTION TRIGGER
-- Prevents client-side modification of the profiles.role column.
-- A normal authenticated user must NOT be able to set their own
-- role to 'seller' or 'admin' through a direct profile update.
--
-- Role changes are permitted only from:
--   - service_role connections (backend/admin)
--   - Direct database connections (SQL Editor, migrations)
--
-- How it works:
--   In Supabase, current_setting('request.jwt.claim.role')
--   returns 'authenticated' for normal user sessions, and
--   'service_role' for service-role key connections. Direct
--   DB connections have no JWT and return NULL.
--   This trigger blocks role changes ONLY from 'authenticated'
--   (normal user) sessions.
-- =============================================================

CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Block role changes from authenticated (normal user) sessions
    -- Allow: service_role (backend), NULL (direct connection/SQL editor)
    IF current_setting('request.jwt.claim.role', true) = 'authenticated' THEN
      RAISE EXCEPTION 'Unauthorized: role changes are not permitted from client-side requests';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.prevent_role_change IS
  'Prevents client-side role escalation — only backend/admin can modify profiles.role';

DROP TRIGGER IF EXISTS trg_prevent_role_change ON public.profiles;

CREATE TRIGGER trg_prevent_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_change();


-- =============================================================
-- 5. AUTO-UPDATE updated_at TRIGGERS
-- Automatically sets updated_at = now() on every UPDATE.
-- =============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply to all tables with updated_at column
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_seller_profiles_updated_at
  BEFORE UPDATE ON public.seller_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_districts_updated_at
  BEFORE UPDATE ON public.districts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ===== FILE: 005_storage.sql =====
-- =============================================
-- ODOP Nexus — Migration 005: Storage
-- =============================================
-- Creates Supabase Storage bucket for product images.
-- Follows: Database Implementation §33-34
--
-- Storage path structure:
--   product-images/{product_id}/image-1.jpg
--
-- Security:
--   - Public read access (bucket is public)
--   - Upload/update/delete restricted to the seller
--     who owns the product matching the folder product_id
-- =============================================

-- Create the product-images bucket (public for read access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;


-- ===== Storage Policies =====

-- Public read access (bucket is public)
CREATE POLICY "product_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Only the owning seller can upload images to their product folder.
-- The first folder segment in the path must be a product_id that
-- belongs to the authenticated seller.
CREATE POLICY "product_images_owner_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT p.id::text FROM public.products p
      JOIN public.seller_profiles sp ON p.seller_id = sp.id
      WHERE sp.user_id = auth.uid()
    )
  );

-- Only the owning seller can update images in their product folder.
CREATE POLICY "product_images_owner_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT p.id::text FROM public.products p
      JOIN public.seller_profiles sp ON p.seller_id = sp.id
      WHERE sp.user_id = auth.uid()
    )
  );

-- Only the owning seller can delete images in their product folder.
CREATE POLICY "product_images_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT p.id::text FROM public.products p
      JOIN public.seller_profiles sp ON p.seller_id = sp.id
      WHERE sp.user_id = auth.uid()
    )
  );


-- ===== FILE: seeds/001_districts.sql =====
-- =============================================
-- ODOP Nexus — Seed: Districts
-- =============================================
-- Real ODOP districts from various Indian states.
-- Used as reference data for development and testing.
-- =============================================

INSERT INTO public.districts (name, state, slug, description, odop_product_name, is_active)
VALUES
  -- Maharashtra
  ('Pune', 'Maharashtra', 'pune', 'Known for its rich cultural heritage and manufacturing', 'Puneri Pagdi', true),
  ('Nashik', 'Maharashtra', 'nashik', 'Famous for grapes, wine, and religious significance', 'Nashik Grapes', true),
  ('Kolhapur', 'Maharashtra', 'kolhapur', 'Known for traditional leather footwear and cuisine', 'Kolhapuri Chappal', true),
  ('Aurangabad', 'Maharashtra', 'aurangabad', 'Known for Paithani sarees and silk weaving', 'Paithani Saree', true),
  ('Solapur', 'Maharashtra', 'solapur', 'Famous for handloom textiles and chaddar', 'Solapur Chaddar', true),
  ('Nagpur', 'Maharashtra', 'nagpur', 'Known for oranges and traditional products', 'Nagpur Orange', true),

  -- Uttar Pradesh
  ('Varanasi', 'Uttar Pradesh', 'varanasi', 'World-famous for Banarasi silk sarees', 'Banarasi Silk Saree', true),
  ('Lucknow', 'Uttar Pradesh', 'lucknow', 'Known for Chikankari embroidery work', 'Lucknowi Chikankari', true),
  ('Agra', 'Uttar Pradesh', 'agra', 'Famous for marble inlay work and leather goods', 'Agra Petha', true),
  ('Firozabad', 'Uttar Pradesh', 'firozabad', 'Glass bangle manufacturing hub', 'Firozabad Glass Bangles', true),
  ('Moradabad', 'Uttar Pradesh', 'moradabad', 'Known as Brass City for metalwork', 'Moradabad Brassware', true),

  -- Rajasthan
  ('Jaipur', 'Rajasthan', 'jaipur', 'Known for gemstones, block printing, and blue pottery', 'Jaipur Blue Pottery', true),
  ('Jodhpur', 'Rajasthan', 'jodhpur', 'Famous for handicrafts and bandhani textiles', 'Jodhpuri Bandhani', true),
  ('Udaipur', 'Rajasthan', 'udaipur', 'Known for miniature paintings and traditional art', 'Udaipur Miniature Painting', true),

  -- Gujarat
  ('Kutch', 'Gujarat', 'kutch', 'Famous for embroidery, mirror work, and handicrafts', 'Kutchi Embroidery', true),
  ('Surat', 'Gujarat', 'surat', 'Known as diamond and textile hub', 'Surat Diamond', true),
  ('Rajkot', 'Gujarat', 'rajkot', 'Known for traditional jewelry and handicrafts', 'Rajkot Patola', true),

  -- West Bengal
  ('Murshidabad', 'West Bengal', 'murshidabad', 'Known for silk weaving and ivory work', 'Murshidabad Silk', true),
  ('Darjeeling', 'West Bengal', 'darjeeling', 'World-famous for premium tea', 'Darjeeling Tea', true),

  -- Tamil Nadu
  ('Kanchipuram', 'Tamil Nadu', 'kanchipuram', 'Famous for Kanjivaram silk sarees', 'Kanjivaram Silk Saree', true),
  ('Thanjavur', 'Tamil Nadu', 'thanjavur', 'Known for Tanjore paintings and bronze work', 'Thanjavur Painting', true),

  -- Karnataka
  ('Mysuru', 'Karnataka', 'mysuru', 'Known for silk, sandalwood, and traditional crafts', 'Mysore Silk', true),

  -- Kashmir
  ('Srinagar', 'Jammu & Kashmir', 'srinagar', 'Famous for Pashmina shawls and papier-mache', 'Kashmiri Pashmina', true),

  -- Madhya Pradesh
  ('Chanderi', 'Madhya Pradesh', 'chanderi', 'Known for Chanderi fabric and sarees', 'Chanderi Saree', true),

  -- Odisha
  ('Puri', 'Odisha', 'puri', 'Known for Pattachitra paintings and applique work', 'Puri Pattachitra', true)

ON CONFLICT (slug) DO NOTHING;


-- ===== FILE: seeds/002_categories.sql =====
-- =============================================
-- ODOP Nexus — Seed: Categories
-- =============================================
-- Product categories as specified in the PRD.
-- =============================================

INSERT INTO public.categories (name, slug, description, is_active)
VALUES
  ('Textiles', 'textiles', 'Handloom fabrics, sarees, shawls, and woven products', true),
  ('Handicrafts', 'handicrafts', 'Handcrafted decorative and functional items', true),
  ('Food Products', 'food-products', 'Traditional and local food specialties', true),
  ('Agricultural Products', 'agricultural-products', 'Farm produce and agricultural specialties', true),
  ('Traditional Products', 'traditional-products', 'Heritage and culturally significant products', true),
  ('Pottery & Ceramics', 'pottery-ceramics', 'Traditional pottery, ceramics, and clay work', true),
  ('Jewelry & Accessories', 'jewelry-accessories', 'Traditional jewelry, bangles, and accessories', true),
  ('Leather Goods', 'leather-goods', 'Traditional leather footwear and accessories', true),
  ('Metalwork', 'metalwork', 'Brass, copper, and metal craft products', true),
  ('Art & Paintings', 'art-paintings', 'Traditional paintings, prints, and artwork', true),
  ('Other', 'other', 'Other ODOP and local products', true)
ON CONFLICT (slug) DO NOTHING;
