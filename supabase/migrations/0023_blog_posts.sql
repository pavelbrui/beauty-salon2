-- Blog posts table for SEO-optimized beauty salon blog
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  title_en text,
  title_ru text,
  slug text UNIQUE NOT NULL,
  category text NOT NULL DEFAULT 'tips',
  excerpt text,
  excerpt_en text,
  excerpt_ru text,
  author text DEFAULT 'Katarzyna Brui',
  cover_image_url text,
  seo_keywords text[] DEFAULT '{}',
  content_blocks jsonb DEFAULT '[]'::jsonb,
  is_published boolean DEFAULT false,
  published_at timestamptz,
  reading_time_minutes integer DEFAULT 5,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON public.blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON public.blog_posts(is_published, published_at DESC);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_posts_select_public" ON public.blog_posts
  FOR SELECT TO public USING (true);
CREATE POLICY "blog_posts_insert_admin" ON public.blog_posts
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "blog_posts_update_admin" ON public.blog_posts
  FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "blog_posts_delete_admin" ON public.blog_posts
  FOR DELETE TO authenticated USING (public.is_admin());

CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_blog_posts_updated_at();
