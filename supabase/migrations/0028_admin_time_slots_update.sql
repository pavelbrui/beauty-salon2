-- =====================================================
-- FIX: Admin can update any time_slot (for booking edits)
-- Applied: 2026-02-23
-- =====================================================
-- Ensures admin can update time_slots linked to phone bookings (user_id=null)
-- and any other time_slot when editing reservations in admin panel.

DROP POLICY IF EXISTS "time_slots_update_related" ON public.time_slots;

-- Admin can update any time_slot; users can update only their own booking's slot
CREATE POLICY "time_slots_update_admin" ON public.time_slots FOR UPDATE TO authenticated
  USING (public.is_admin());

CREATE POLICY "time_slots_update_own_booking" ON public.time_slots FOR UPDATE TO authenticated
  USING (
    NOT public.is_admin() AND EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.time_slot_id = time_slots.id AND bookings.user_id = auth.uid()
    )
  );
