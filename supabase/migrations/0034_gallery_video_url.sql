-- Add video_url column to service_images table for gallery videos
ALTER TABLE service_images
  ADD COLUMN IF NOT EXISTS video_url text;
