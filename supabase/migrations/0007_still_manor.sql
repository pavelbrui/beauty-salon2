/*
  # Add description column to service_images table

  1. Changes
    - Add description column to service_images table
    - Set default empty string value
    - Update existing rows
*/

-- Add description column
ALTER TABLE service_images 
ADD COLUMN description text DEFAULT '' NOT NULL;

-- Update existing rows to have an empty description
UPDATE service_images 
SET description = '' 
WHERE description IS NULL;