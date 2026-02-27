-- Add is_hidden flag for services visibility
ALTER TABLE services
ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

-- Update SELECT policy: hide hidden services from non-admins
DROP POLICY IF EXISTS "Services are viewable by everyone" ON services;
CREATE POLICY "Services are viewable by everyone"
  ON services FOR SELECT
  TO public
  USING (
    (COALESCE(is_hidden, false) = false)
    OR ((auth.jwt() ->> 'role') = 'admin')
  );

