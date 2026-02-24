-- =====================================================
-- BOOKSY SYNC: Outbound sync from site → Booksy Pro calendar
-- Creates time blocks on Booksy when bookings change
-- =====================================================

-- 1. Sync log — tracks every sync attempt
CREATE TABLE IF NOT EXISTS public.booksy_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('create_block', 'update_block', 'remove_block')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed')),
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  stylist_name text,
  error_message text,
  screenshot_url text,
  attempts integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE public.booksy_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "booksy_sync_log_select_admin" ON public.booksy_sync_log
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "booksy_sync_log_insert_auth" ON public.booksy_sync_log
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "booksy_sync_log_update_admin" ON public.booksy_sync_log
  FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "booksy_sync_log_delete_admin" ON public.booksy_sync_log
  FOR DELETE TO authenticated USING (public.is_admin());

CREATE INDEX idx_booksy_sync_log_status ON public.booksy_sync_log(status);
CREATE INDEX idx_booksy_sync_log_booking ON public.booksy_sync_log(booking_id);
CREATE INDEX idx_booksy_sync_log_created ON public.booksy_sync_log(created_at DESC);

-- 2. Booksy session — persists browser cookies for Puppeteer
CREATE TABLE IF NOT EXISTS public.booksy_session (
  id text PRIMARY KEY DEFAULT 'default',
  cookies jsonb NOT NULL DEFAULT '[]'::jsonb,
  user_agent text,
  last_used_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_valid boolean DEFAULT true
);

ALTER TABLE public.booksy_session ENABLE ROW LEVEL SECURITY;

CREATE POLICY "booksy_session_select_admin" ON public.booksy_session
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "booksy_session_insert_admin" ON public.booksy_session
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "booksy_session_update_admin" ON public.booksy_session
  FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "booksy_session_delete_admin" ON public.booksy_session
  FOR DELETE TO authenticated USING (public.is_admin());
