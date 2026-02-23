-- Service categories table for ordering/prioritization
CREATE TABLE IF NOT EXISTS service_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text UNIQUE NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Seed from existing service categories
INSERT INTO service_categories (name, sort_order)
SELECT DISTINCT category, ROW_NUMBER() OVER (ORDER BY category) * 10
FROM services
ON CONFLICT (name) DO NOTHING;

-- RLS
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read service_categories"
  ON service_categories FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage service_categories"
  ON service_categories FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
