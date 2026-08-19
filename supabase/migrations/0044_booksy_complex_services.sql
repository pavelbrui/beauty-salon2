-- =====================================================
-- BOOKSY INTEGRATION: Complex Services Dual-Worker Mapping
-- Maps service names to additional stylists for auto-reservation
-- =====================================================

CREATE TABLE IF NOT EXISTS public.booksy_complex_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booksy_service_name text NOT NULL UNIQUE,
  additional_stylist_id uuid NOT NULL REFERENCES public.stylists(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.booksy_complex_services ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Admin
CREATE POLICY "booksy_complex_services_select_admin" ON public.booksy_complex_services
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "booksy_complex_services_insert_admin" ON public.booksy_complex_services
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "booksy_complex_services_update_admin" ON public.booksy_complex_services
  FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "booksy_complex_services_delete_admin" ON public.booksy_complex_services
  FOR DELETE TO authenticated USING (public.is_admin());

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_booksy_complex_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booksy_complex_services_updated_at
  BEFORE UPDATE ON public.booksy_complex_services
  FOR EACH ROW EXECUTE FUNCTION update_booksy_complex_services_updated_at();
