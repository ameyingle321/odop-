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
