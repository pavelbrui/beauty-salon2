-- Add configurable cover image display heights for trainings
ALTER TABLE trainings
  ADD COLUMN IF NOT EXISTS cover_height_card integer DEFAULT 224,
  ADD COLUMN IF NOT EXISTS cover_height_detail integer DEFAULT 384;

COMMENT ON COLUMN trainings.cover_height_card IS 'Display height (px) for cover image on training list cards';
COMMENT ON COLUMN trainings.cover_height_detail IS 'Display height (px) for cover image on training detail page hero';
