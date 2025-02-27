/*
  # Add date column to stylist_working_hours

  1. Changes
    - Add date column to stylist_working_hours table
    - Update existing records with NULL date
    - Add index for faster date-based queries

  2. Notes
    - This allows storing both recurring and one-time schedules
    - The date column can be NULL for legacy records
*/

-- Add date column
ALTER TABLE stylist_working_hours
ADD COLUMN date date;

-- Create index for date-based queries
CREATE INDEX idx_stylist_hours_date ON stylist_working_hours(date);