-- =====================================================
-- BOOKSY HTTP API: Migrate from Puppeteer to direct HTTP API calls
-- Adds access_token to session, resource mapping, reservation tracking
-- =====================================================

-- 1. Add access_token and related fields to booksy_session
ALTER TABLE public.booksy_session
  ADD COLUMN IF NOT EXISTS access_token text,
  ADD COLUMN IF NOT EXISTS api_key text,
  ADD COLUMN IF NOT EXISTS fingerprint text;

-- 2. Add booksy_resource_id to stylist mapping (Booksy worker numeric ID)
ALTER TABLE public.booksy_stylist_mapping
  ADD COLUMN IF NOT EXISTS booksy_resource_id integer;

-- 3. Add booksy_reservation_id to bookings (for delete/update tracking)
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS booksy_reservation_id bigint;

-- 4. Add booksy_reservation_id to sync_log (for reference)
ALTER TABLE public.booksy_sync_log
  ADD COLUMN IF NOT EXISTS booksy_reservation_id bigint;
