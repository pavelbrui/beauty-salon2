DROP POLICY IF EXISTS "notifications_insert_auth" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_admin" ON public.notifications;
DROP POLICY IF EXISTS "booking_notif_select_own" ON public.booking_notifications;
DROP POLICY IF EXISTS "booking_notif_insert_auth" ON public.booking_notifications;
-- No further actions; policies will be recreated by existing migration 0018.
