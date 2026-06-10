-- Migration: Fix duplicate policies for notifications

DROP POLICY IF EXISTS "notifications_select_own_or_admin" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_auth" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_admin" ON public.notifications;

CREATE POLICY "notifications_select_own_or_admin" ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "notifications_insert_auth" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "notifications_update_admin" ON public.notifications FOR UPDATE TO authenticated USING (public.is_admin());
