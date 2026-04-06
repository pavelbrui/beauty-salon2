-- Add autoseo_id column to blog_posts for deduplication of AutoSEO webhook deliveries
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS autoseo_id integer UNIQUE;

-- Index for fast lookup by autoseo_id
CREATE INDEX IF NOT EXISTS idx_blog_posts_autoseo_id ON public.blog_posts (autoseo_id) WHERE autoseo_id IS NOT NULL;
