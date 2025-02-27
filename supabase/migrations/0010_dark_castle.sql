/*
  # Add contact information for bookings

  1. Changes
    - Add contact information columns to bookings table
    - Add notification preferences
    - Add booking notifications table
*/

-- Add contact information to bookings
ALTER TABLE bookings
ADD COLUMN contact_name text NOT NULL DEFAULT '',
ADD COLUMN contact_phone text NOT NULL DEFAULT '',
ADD COLUMN contact_email text NOT NULL DEFAULT '',
ADD COLUMN notes text,
ADD COLUMN notification_email boolean DEFAULT true,
ADD COLUMN notification_sms boolean DEFAULT false;

-- Create booking_notifications table
CREATE TABLE booking_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('confirmation', 'reminder', 'status_update')),
  status text NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE booking_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications"
  ON booking_notifications FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM bookings WHERE id = booking_id
    )
  );