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
