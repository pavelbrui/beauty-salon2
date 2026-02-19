/*
  # Add translation columns to services

  Adds name_en, name_ru, description_en, description_ru columns
  to support multilingual service names and descriptions.
  Polish (name, description) remains the default/primary language.
*/

ALTER TABLE services ADD COLUMN IF NOT EXISTS name_en text;
ALTER TABLE services ADD COLUMN IF NOT EXISTS name_ru text;
ALTER TABLE services ADD COLUMN IF NOT EXISTS description_en text;
ALTER TABLE services ADD COLUMN IF NOT EXISTS description_ru text;
