-- =====================================================
-- BOOKSY CONFLICT RESOLUTION: Store Booksy booking URL
-- When a Booksy sync conflict occurs, provide client with direct booking link
-- =====================================================

-- 1. Add columns to bookings table for Booksy conflict handling
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS booksy_booking_url text,
  ADD COLUMN IF NOT EXISTS conflict_error_message text;

-- 2. Add booksy_booking_url column to sync_log for reference
ALTER TABLE public.booksy_sync_log
  ADD COLUMN IF NOT EXISTS booksy_booking_url text;

-- Create index for quick lookup of bookings with conflict URLs
CREATE INDEX IF NOT EXISTS idx_bookings_booksy_url ON public.bookings(booksy_booking_url) WHERE booksy_booking_url IS NOT NULL;
