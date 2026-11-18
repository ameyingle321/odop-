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

