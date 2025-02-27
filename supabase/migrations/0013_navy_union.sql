/*
  # Add time slots table and update booking logic
  
  1. New Tables
    - `time_slots`
      - `id` (uuid, primary key)
      - `stylist_id` (uuid, references stylists)
      - `start_time` (timestamptz)
      - `end_time` (timestamptz)
      - `is_available` (boolean)
      - `booking_id` (uuid, references bookings)
  2. Security
    - Enable RLS on `time_slots` table
    - Add policies for public read and authenticated write
*/

-- Create time_slots table
CREATE TABLE IF NOT EXISTS time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stylist_id uuid REFERENCES stylists(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  is_available boolean DEFAULT true,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Enable RLS
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Time slots are viewable by everyone"
  ON time_slots FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Time slots can be updated by authenticated users"
  ON time_slots FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_time_slots_stylist_date ON time_slots(stylist_id, start_time);
CREATE INDEX idx_time_slots_availability ON time_slots(is_available);