-- Add translation columns for gallery image descriptions
ALTER TABLE service_images
  ADD COLUMN IF NOT EXISTS description_en TEXT,
  ADD COLUMN IF NOT EXISTS description_ru TEXT;
