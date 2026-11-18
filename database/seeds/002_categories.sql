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
