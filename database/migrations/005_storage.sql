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
