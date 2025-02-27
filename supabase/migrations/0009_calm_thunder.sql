/*
  # Add stylist service relations and calendar management

  1. New Tables
    - `stylist_services`: Links stylists with services they provide
    - `stylist_schedules`: Stores stylist working hours and availability
    - `stylist_bookings`: Links bookings with specific stylists

  2. Changes
    - Added foreign key relationships
    - Added RLS policies for secure access
*/

-- Create stylist_services table
CREATE TABLE stylist_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stylist_id uuid REFERENCES stylists(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(stylist_id, service_id)
);

-- Create stylist_schedules table
CREATE TABLE stylist_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stylist_id uuid REFERENCES stylists(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_working boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Add stylist_id to bookings table
ALTER TABLE bookings
ADD COLUMN stylist_id uuid REFERENCES stylists(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE stylist_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE stylist_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies for stylist_services
CREATE POLICY "Stylist services are viewable by everyone"
  ON stylist_services FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Stylist services are editable by admins only"
  ON stylist_services FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Create policies for stylist_schedules
CREATE POLICY "Stylist schedules are viewable by everyone"
  ON stylist_schedules FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Stylists can manage their own schedules"
  ON stylist_schedules FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM stylists WHERE id = stylist_id
    ) OR auth.jwt() ->> 'role' = 'admin'
  );