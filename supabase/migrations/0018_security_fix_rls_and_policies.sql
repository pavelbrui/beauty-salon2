-- =====================================================
-- SECURITY FIX: Enable RLS, create helper, fix all policies
-- Applied: 2026-02-19
-- =====================================================

-- Helper function for admin check (uses correct JWT path via app_metadata)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create missing admin_notifications table
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('cancelled', 'rescheduled', 'rebooked', 'deleted')),
  admin_email text,
  message text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on ALL tables
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stylists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stylist_service_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stylist_working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stylist_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing broken policies (they checked wrong JWT field: role instead of app_metadata.role)
DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Services are viewable by everyone" ON public.services;
DROP POLICY IF EXISTS "Services are editable by admins only" ON public.services;
DROP POLICY IF EXISTS "Stylists are viewable by everyone" ON public.stylists;
DROP POLICY IF EXISTS "Stylists are editable by admins only" ON public.stylists;
DROP POLICY IF EXISTS "Service images are viewable by everyone" ON public.service_images;
DROP POLICY IF EXISTS "Service images are editable by admins only" ON public.service_images;
DROP POLICY IF EXISTS "Stylist assignments viewable by everyone" ON public.stylist_service_assignments;
DROP POLICY IF EXISTS "Stylist assignments editable by admins only" ON public.stylist_service_assignments;
DROP POLICY IF EXISTS "Working hours viewable by everyone" ON public.stylist_working_hours;
DROP POLICY IF EXISTS "Working hours editable by admins only" ON public.stylist_working_hours;
DROP POLICY IF EXISTS "Email templates are viewable by admins only" ON public.email_templates;
DROP POLICY IF EXISTS "Notifications are viewable by owner or admin" ON public.notifications;
DROP POLICY IF EXISTS "Files are publicly accessible" ON public.storage_files;
DROP POLICY IF EXISTS "Only admins can upload files" ON public.storage_files;
DROP POLICY IF EXISTS "Only admins can update files" ON public.storage_files;
DROP POLICY IF EXISTS "Only admins can delete files" ON public.storage_files;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.booking_notifications;
DROP POLICY IF EXISTS "Stylist schedules are viewable by everyone" ON public.stylist_schedules;
DROP POLICY IF EXISTS "Stylists can manage their own schedules" ON public.stylist_schedules;
DROP POLICY IF EXISTS "Time slots are viewable by everyone" ON public.time_slots;
DROP POLICY IF EXISTS "Time slots can be created by authenticated users" ON public.time_slots;
DROP POLICY IF EXISTS "Users can create time slots when booking" ON public.time_slots;
DROP POLICY IF EXISTS "Time slots can be updated by owner or admin" ON public.time_slots;
DROP POLICY IF EXISTS "Stylist services are viewable by everyone" ON public.stylist_services;
DROP POLICY IF EXISTS "Stylist services are editable by admins only" ON public.stylist_services;

-- =====================================================
-- NEW POLICIES (correct admin check via app_metadata)
-- =====================================================

-- SERVICES (public read, admin write)
CREATE POLICY "services_select_public" ON public.services FOR SELECT TO public USING (true);
CREATE POLICY "services_insert_admin" ON public.services FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "services_update_admin" ON public.services FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "services_delete_admin" ON public.services FOR DELETE TO authenticated USING (public.is_admin());

-- STYLISTS (public read, admin write)
CREATE POLICY "stylists_select_public" ON public.stylists FOR SELECT TO public USING (true);
CREATE POLICY "stylists_insert_admin" ON public.stylists FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "stylists_update_admin" ON public.stylists FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "stylists_delete_admin" ON public.stylists FOR DELETE TO authenticated USING (public.is_admin());

-- SERVICE_IMAGES (public read, admin write)
CREATE POLICY "service_images_select_public" ON public.service_images FOR SELECT TO public USING (true);
CREATE POLICY "service_images_insert_admin" ON public.service_images FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "service_images_update_admin" ON public.service_images FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "service_images_delete_admin" ON public.service_images FOR DELETE TO authenticated USING (public.is_admin());

-- STYLIST_SERVICE_ASSIGNMENTS (public read, admin write)
CREATE POLICY "assignments_select_public" ON public.stylist_service_assignments FOR SELECT TO public USING (true);
CREATE POLICY "assignments_insert_admin" ON public.stylist_service_assignments FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "assignments_update_admin" ON public.stylist_service_assignments FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "assignments_delete_admin" ON public.stylist_service_assignments FOR DELETE TO authenticated USING (public.is_admin());

-- STYLIST_WORKING_HOURS (public read, admin write)
CREATE POLICY "working_hours_select_public" ON public.stylist_working_hours FOR SELECT TO public USING (true);
CREATE POLICY "working_hours_insert_admin" ON public.stylist_working_hours FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "working_hours_update_admin" ON public.stylist_working_hours FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "working_hours_delete_admin" ON public.stylist_working_hours FOR DELETE TO authenticated USING (public.is_admin());

-- BOOKINGS (user sees own + admin sees all)
CREATE POLICY "bookings_select_own_or_admin" ON public.bookings FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "bookings_insert_own" ON public.bookings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookings_update_own_or_admin" ON public.bookings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "bookings_delete_own_or_admin" ON public.bookings FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- TIME_SLOTS (public read, authenticated insert, related user or admin update/delete)
CREATE POLICY "time_slots_select_public" ON public.time_slots FOR SELECT TO public USING (true);
CREATE POLICY "time_slots_insert_auth" ON public.time_slots FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "time_slots_update_related" ON public.time_slots FOR UPDATE TO authenticated
  USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.time_slot_id = time_slots.id AND bookings.user_id = auth.uid()
    )
  );
CREATE POLICY "time_slots_delete_admin" ON public.time_slots FOR DELETE TO authenticated USING (public.is_admin());

-- EMAIL_TEMPLATES (admin only)
CREATE POLICY "email_templates_select_admin" ON public.email_templates FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "email_templates_insert_admin" ON public.email_templates FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "email_templates_update_admin" ON public.email_templates FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "email_templates_delete_admin" ON public.email_templates FOR DELETE TO authenticated USING (public.is_admin());

-- NOTIFICATIONS (user sees own, admin sees all, authenticated can insert)
CREATE POLICY "notifications_select_own_or_admin" ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "notifications_insert_auth" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "notifications_update_admin" ON public.notifications FOR UPDATE TO authenticated USING (public.is_admin());

-- BOOKING_NOTIFICATIONS (user sees own via booking join, authenticated can insert)
CREATE POLICY "booking_notif_select_own" ON public.booking_notifications FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.id = booking_notifications.booking_id
    AND (bookings.user_id = auth.uid() OR public.is_admin())
  ));
CREATE POLICY "booking_notif_insert_auth" ON public.booking_notifications FOR INSERT TO authenticated WITH CHECK (true);

-- ADMIN_NOTIFICATIONS (authenticated can insert, only admin can read/update)
CREATE POLICY "admin_notif_insert_auth" ON public.admin_notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "admin_notif_select_admin" ON public.admin_notifications FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "admin_notif_update_admin" ON public.admin_notifications FOR UPDATE TO authenticated USING (public.is_admin());

-- STORAGE_FILES (public read, admin write)
CREATE POLICY "storage_files_select_public" ON public.storage_files FOR SELECT TO public USING (true);
CREATE POLICY "storage_files_insert_admin" ON public.storage_files FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "storage_files_update_admin" ON public.storage_files FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "storage_files_delete_admin" ON public.storage_files FOR DELETE TO authenticated USING (public.is_admin());

-- STYLIST_SERVICES (deprecated, public read, admin write)
CREATE POLICY "stylist_services_select_public" ON public.stylist_services FOR SELECT TO public USING (true);
CREATE POLICY "stylist_services_insert_admin" ON public.stylist_services FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "stylist_services_update_admin" ON public.stylist_services FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "stylist_services_delete_admin" ON public.stylist_services FOR DELETE TO authenticated USING (public.is_admin());

-- STYLIST_SCHEDULES (deprecated, public read, admin write)
CREATE POLICY "stylist_schedules_select_public" ON public.stylist_schedules FOR SELECT TO public USING (true);
CREATE POLICY "stylist_schedules_insert_admin" ON public.stylist_schedules FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "stylist_schedules_update_admin" ON public.stylist_schedules FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "stylist_schedules_delete_admin" ON public.stylist_schedules FOR DELETE TO authenticated USING (public.is_admin());

-- =====================================================
-- FIX STORAGE BUCKET POLICIES (restrict uploads to admin only)
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

CREATE POLICY "storage_public_read" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'service-images');
CREATE POLICY "storage_admin_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'service-images' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "storage_admin_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'service-images' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "storage_admin_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'service-images' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
