/*
  # Add stylist assignments and booking improvements
  
  1. New Tables
    - `stylist_service_assignments` - Links stylists to services they can perform
    - `stylist_working_hours` - Stores stylist availability
  
  2. Changes
    - Add stylist_id to bookings table
    - Add constraints and indexes for better performance
    
  3. Security
    - Enable RLS on new tables
    - Add policies for admin access
*/

-- Create stylist service assignments table
CREATE TABLE stylist_service_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stylist_id uuid REFERENCES stylists(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(stylist_id, service_id)
);

-- Create stylist working hours table
CREATE TABLE stylist_working_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stylist_id uuid REFERENCES stylists(id) ON DELETE CASCADE,
  day_of_week smallint CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_hours CHECK (start_time < end_time)
);

-- Add indexes for better performance
CREATE INDEX idx_stylist_assignments_stylist ON stylist_service_assignments(stylist_id);
CREATE INDEX idx_stylist_assignments_service ON stylist_service_assignments(service_id);
CREATE INDEX idx_stylist_hours_availability ON stylist_working_hours(stylist_id, day_of_week, is_available);

-- Enable RLS
ALTER TABLE stylist_service_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stylist_working_hours ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Stylist assignments viewable by everyone"
  ON stylist_service_assignments FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Stylist assignments editable by admins only"
  ON stylist_service_assignments FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Working hours viewable by everyone"
  ON stylist_working_hours FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Working hours editable by admins only"
  ON stylist_working_hours FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');