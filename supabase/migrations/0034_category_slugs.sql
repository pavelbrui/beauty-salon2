-- Add slug column to service_categories for clean SEO URLs
ALTER TABLE service_categories
  ADD COLUMN IF NOT EXISTS slug text;

-- Populate slugs for existing categories
UPDATE service_categories SET slug = 'makijaz-permanentny' WHERE lower(name) = 'makijaż permanentny';
UPDATE service_categories SET slug = 'stylizacja-rzes' WHERE lower(name) = 'stylizacja rzęs';
UPDATE service_categories SET slug = 'stylizacja-brwi' WHERE lower(name) = 'stylizacja brwi';
UPDATE service_categories SET slug = 'peeling-weglowy' WHERE lower(name) = 'peeling węglowy';
UPDATE service_categories SET slug = 'laserowe-usuwanie' WHERE lower(name) = 'laserowe usuwanie';
UPDATE service_categories SET slug = 'manicure-i-pedicure' WHERE lower(name) = 'manicure i pedicure';
UPDATE service_categories SET slug = 'pakiety' WHERE lower(name) = 'pakiety';

-- Make slug unique and not null after population
ALTER TABLE service_categories
  ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS service_categories_slug_key ON service_categories(slug);
