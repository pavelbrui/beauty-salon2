-- =====================================================
-- ADMIN BOOKINGS: custom booking price + phone bookings
-- Applied: 2026-02-23
-- =====================================================

-- Allow overriding service price per booking (stored in cents)
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS price_override integer CHECK (price_override >= 0);

-- Allow admins to insert manual bookings (for phone reservations)
DROP POLICY IF EXISTS "bookings_insert_own" ON public.bookings;
DROP POLICY IF EXISTS "bookings_insert_own_or_admin" ON public.bookings;

CREATE POLICY "bookings_insert_own_or_admin" ON public.bookings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.is_admin());
