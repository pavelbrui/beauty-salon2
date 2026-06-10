-- Migration: Fix duplicate policies for booking notifications

DROP POLICY IF EXISTS "booking_notif_select_own" ON public.booking_notifications;
DROP POLICY IF EXISTS "booking_notif_insert_auth" ON public.booking_notifications;

CREATE POLICY "booking_notif_select_own" ON public.booking_notifications FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.id = booking_notifications.booking_id
      AND (bookings.user_id = auth.uid() OR public.is_admin())
  ));

CREATE POLICY "booking_notif_insert_auth" ON public.booking_notifications FOR INSERT TO authenticated WITH CHECK (true);
