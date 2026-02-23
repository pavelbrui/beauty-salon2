-- =====================================================
-- PROFILES: add role column for table-based admin/client roles
-- Applied: 2026-02-23
-- =====================================================

-- Add role column (admin, client; extensible for future roles)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'client';

-- Set default for existing rows
UPDATE public.profiles SET role = 'client' WHERE role IS NULL;

-- Constraint: allow admin, client, and future roles (moderator, stylist, etc.)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'client', 'moderator', 'stylist'));

-- Update handle_new_user to set role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'client')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- is_admin: check profiles.role first, fallback to app_metadata (legacy)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RETURN true;
  END IF;
  RETURN coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Allow admins to update any profile (for role changes)
CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_admin());

-- Prevent non-admins from changing their own role
CREATE OR REPLACE FUNCTION public.check_role_change_by_admin()
RETURNS trigger AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can change user role';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS profiles_check_role_change ON public.profiles;
CREATE TRIGGER profiles_check_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.check_role_change_by_admin();
