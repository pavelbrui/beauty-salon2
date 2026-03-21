-- Google Business Profile session storage (cookies for automated posting)
CREATE TABLE IF NOT EXISTS public.google_business_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cookies jsonb NOT NULL DEFAULT '[]'::jsonb,
  user_agent text,
  last_used_at timestamptz DEFAULT now(),
  is_valid boolean DEFAULT true,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.google_business_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gbp_sessions_select_admin" ON public.google_business_sessions
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "gbp_sessions_all_service" ON public.google_business_sessions
  FOR ALL TO service_role USING (true);

-- Track GBP posting status on instagram_posts
ALTER TABLE public.instagram_posts ADD COLUMN IF NOT EXISTS gbp_post_status text DEFAULT 'pending';
ALTER TABLE public.instagram_posts ADD COLUMN IF NOT EXISTS gbp_error text;
