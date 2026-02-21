-- Separate crop and image fields for card vs detail page views
ALTER TABLE trainings
  ADD COLUMN IF NOT EXISTS cover_crop_card text,
  ADD COLUMN IF NOT EXISTS cover_crop_detail text,
  ADD COLUMN IF NOT EXISTS cover_image_url_detail text;

-- Migrate existing crop data to both card and detail
UPDATE trainings SET
  cover_crop_card = cover_image_position,
  cover_crop_detail = cover_image_position
WHERE cover_image_position IS NOT NULL;

COMMENT ON COLUMN trainings.cover_crop_card IS 'Crop JSON for card display';
COMMENT ON COLUMN trainings.cover_crop_detail IS 'Crop JSON for detail page display';
COMMENT ON COLUMN trainings.cover_image_url_detail IS 'Optional separate image URL for detail page hero';
