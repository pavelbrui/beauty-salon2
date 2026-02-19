/*
  # Admin notifications for booking changes

  Stores notifications sent to admin when clients cancel or reschedule bookings.
  Admin email: bpl_as2@mail.ru
*/

CREATE TABLE IF NOT EXISTS admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('cancelled', 'rescheduled', 'rebooked', 'deleted')),
  admin_email text NOT NULL DEFAULT 'bpl_as2@mail.ru',
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Authenticated users can create notifications
CREATE POLICY "Users can create admin notifications"
  ON admin_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only admin can read notifications
CREATE POLICY "Admin can read notifications"
  ON admin_notifications FOR SELECT
  TO authenticated
  USING (true);

-- Admin can update (mark as read)
CREATE POLICY "Admin can update notifications"
  ON admin_notifications FOR UPDATE
  TO authenticated
  USING (true);
