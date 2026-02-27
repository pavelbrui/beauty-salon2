-- Add booking restriction settings per stylist
ALTER TABLE stylists
  ADD COLUMN IF NOT EXISTS min_advance_hours integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS night_start_hour integer NOT NULL DEFAULT 22,
  ADD COLUMN IF NOT EXISTS night_end_hour integer NOT NULL DEFAULT 6,
  ADD COLUMN IF NOT EXISTS night_min_slot_hour integer NOT NULL DEFAULT 10;
