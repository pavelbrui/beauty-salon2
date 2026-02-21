-- =====================================================
-- BOOKSY INTEGRATION: External booking sync tables
-- Receives parsed Booksy email notifications via webhook
-- =====================================================

-- 1. Booksy stylist name mapping
-- Maps worker names from Booksy emails to internal stylists
CREATE TABLE IF NOT EXISTS public.booksy_stylist_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booksy_name text NOT NULL UNIQUE,
  stylist_id uuid REFERENCES public.stylists(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.booksy_stylist_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "booksy_mapping_select_admin" ON public.booksy_stylist_mapping
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "booksy_mapping_insert_admin" ON public.booksy_stylist_mapping
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "booksy_mapping_update_admin" ON public.booksy_stylist_mapping
  FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "booksy_mapping_delete_admin" ON public.booksy_stylist_mapping
  FOR DELETE TO authenticated USING (public.is_admin());

-- 2. Booksy bookings (external reservations parsed from emails)
CREATE TABLE IF NOT EXISTS public.booksy_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parsed client info
  booksy_client_name text NOT NULL,
  booksy_client_phone text,
  booksy_client_email text,

  -- Parsed booking info
  booksy_service_name text NOT NULL,
  booksy_worker_name text,
  booksy_price_text text,

  -- Parsed time (stored as timestamptz in Europe/Warsaw)
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,

  -- Link to internal stylist (via mapping)
  stylist_id uuid REFERENCES public.stylists(id) ON DELETE SET NULL,

  -- Link to blocking time_slot record
  time_slot_id uuid REFERENCES public.time_slots(id) ON DELETE SET NULL,

  -- Status tracking
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'changed', 'cancelled')),
  sync_status text NOT NULL DEFAULT 'mapped'
    CHECK (sync_status IN ('mapped', 'unmapped', 'error')),

  -- Email metadata (for idempotency and debugging)
  email_subject text,
  email_message_id text UNIQUE,
  email_type text NOT NULL
    CHECK (email_type IN ('new', 'changed', 'cancelled')),

  -- Reference to previous booking (for changes)
  previous_booking_id uuid REFERENCES public.booksy_bookings(id) ON DELETE SET NULL,

  -- Debugging
  raw_email_html text,
  parse_errors text[],

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_booksy_bookings_start ON public.booksy_bookings(start_time);
CREATE INDEX idx_booksy_bookings_stylist ON public.booksy_bookings(stylist_id);
CREATE INDEX idx_booksy_bookings_status ON public.booksy_bookings(status);
CREATE INDEX idx_booksy_bookings_email_id ON public.booksy_bookings(email_message_id);
CREATE INDEX idx_booksy_bookings_client ON public.booksy_bookings(booksy_client_name);

ALTER TABLE public.booksy_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "booksy_bookings_select_admin" ON public.booksy_bookings
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "booksy_bookings_insert_admin" ON public.booksy_bookings
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "booksy_bookings_update_admin" ON public.booksy_bookings
  FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "booksy_bookings_delete_admin" ON public.booksy_bookings
  FOR DELETE TO authenticated USING (public.is_admin());

-- 3. Add reverse link from time_slots to booksy_bookings
ALTER TABLE public.time_slots
  ADD COLUMN IF NOT EXISTS booksy_booking_id uuid REFERENCES public.booksy_bookings(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_time_slots_booksy ON public.time_slots(booksy_booking_id);

-- 4. Updated_at triggers
CREATE OR REPLACE FUNCTION update_booksy_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booksy_bookings_updated_at
  BEFORE UPDATE ON public.booksy_bookings
  FOR EACH ROW EXECUTE FUNCTION update_booksy_bookings_updated_at();

CREATE OR REPLACE FUNCTION update_booksy_mapping_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booksy_mapping_updated_at
  BEFORE UPDATE ON public.booksy_stylist_mapping
  FOR EACH ROW EXECUTE FUNCTION update_booksy_mapping_updated_at();
