/*
  # Fix booking flow - schema and policy updates

  1. Adds missing columns to time_slots table
     - stylist_id (was defined in 0013 but CREATE TABLE IF NOT EXISTS was no-op)
     - booking_id (same reason)

  2. Adds direct time storage to bookings table
     - start_time, end_time for direct access without join

  3. Adds INSERT policy on time_slots for authenticated users
     - Required so non-admin users can create time_slot records during booking

  4. Performance indexes
*/

-- Add missing columns to time_slots (0013 CREATE TABLE IF NOT EXISTS was a no-op if table existed from 0001)
ALTER TABLE time_slots ADD COLUMN IF NOT EXISTS stylist_id uuid REFERENCES stylists(id) ON DELETE CASCADE;
ALTER TABLE time_slots ADD COLUMN IF NOT EXISTS booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL;

-- Add direct time storage to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS start_time timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS end_time timestamptz;

-- Allow authenticated users to create time slot records when booking
CREATE POLICY "Users can create time slots when booking"
  ON time_slots FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_time_slots_stylist ON time_slots(stylist_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON bookings(start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_stylist ON bookings(stylist_id);
