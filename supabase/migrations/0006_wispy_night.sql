/*
  # Add category column to service_images table

  1. Changes
    - Add category column to service_images table
    - Set default category value
    - Update existing rows
*/

-- Add category column
ALTER TABLE service_images 
ADD COLUMN category text DEFAULT 'general' NOT NULL;

-- Update existing rows to have a category
UPDATE service_images 
SET category = 'general' 
WHERE category IS NULL;