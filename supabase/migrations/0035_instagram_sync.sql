-- Instagram sync tracking table
-- Tracks which Instagram posts have been synced to blog/gallery
CREATE TABLE IF NOT EXISTS public.instagram_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instagram_id text UNIQUE NOT NULL,
  instagram_account text NOT NULL,
  permalink text,
  media_type text, -- IMAGE, VIDEO, CAROUSEL_ALBUM
  media_url text,
  thumbnail_url text,
  caption text,
  instagram_timestamp timestamptz,
  blog_post_id uuid REFERENCES public.blog_posts(id) ON DELETE SET NULL,
  gallery_image_id uuid REFERENCES public.service_images(id) ON DELETE SET NULL,
  sync_status text DEFAULT 'pending', -- pending, synced, skipped, error
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_instagram_posts_ig_id ON public.instagram_posts(instagram_id);
CREATE INDEX IF NOT EXISTS idx_instagram_posts_account ON public.instagram_posts(instagram_account);
CREATE INDEX IF NOT EXISTS idx_instagram_posts_status ON public.instagram_posts(sync_status);

ALTER TABLE public.instagram_posts ENABLE ROW LEVEL SECURITY;

-- Public can read (for admin panel display)
CREATE POLICY "instagram_posts_select_public" ON public.instagram_posts
  FOR SELECT TO public USING (true);
-- Only service_role (Netlify functions) can insert/update/delete
CREATE POLICY "instagram_posts_insert_service" ON public.instagram_posts
  FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "instagram_posts_update_service" ON public.instagram_posts
  FOR UPDATE TO service_role USING (true);
CREATE POLICY "instagram_posts_delete_service" ON public.instagram_posts
  FOR DELETE TO service_role USING (true);
-- Admins can also manage
CREATE POLICY "instagram_posts_insert_admin" ON public.instagram_posts
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "instagram_posts_update_admin" ON public.instagram_posts
  FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "instagram_posts_delete_admin" ON public.instagram_posts
  FOR DELETE TO authenticated USING (public.is_admin());

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_instagram_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER instagram_posts_updated_at
  BEFORE UPDATE ON public.instagram_posts
  FOR EACH ROW EXECUTE FUNCTION update_instagram_posts_updated_at();
