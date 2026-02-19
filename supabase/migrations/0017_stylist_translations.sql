/*
  # Add translation columns to stylists

  Adds role_en, role_ru, specialties_en, specialties_ru, description_en, description_ru
  to support multilingual stylist profiles.
  Polish fields (role, specialties, description) remain the primary language.
*/

ALTER TABLE stylists ADD COLUMN IF NOT EXISTS role_en text;
ALTER TABLE stylists ADD COLUMN IF NOT EXISTS role_ru text;
ALTER TABLE stylists ADD COLUMN IF NOT EXISTS specialties_en text[];
ALTER TABLE stylists ADD COLUMN IF NOT EXISTS specialties_ru text[];
ALTER TABLE stylists ADD COLUMN IF NOT EXISTS description_en text;
ALTER TABLE stylists ADD COLUMN IF NOT EXISTS description_ru text;
