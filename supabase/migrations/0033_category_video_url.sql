-- Add video_url column to service_categories for hover video on category cards
ALTER TABLE service_categories
  ADD COLUMN IF NOT EXISTS video_url text;
