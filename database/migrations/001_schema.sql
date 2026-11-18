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
-- This is enforced by backend business logic + database function.
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
