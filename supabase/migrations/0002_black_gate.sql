/*
  # Add email templates and notifications

  1. New Tables
    - `email_templates`
      - `id` (uuid, primary key)
      - `name` (text)
      - `subject` (text)
      - `content` (text)
      - `created_at` (timestamp)
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `booking_id` (uuid, references bookings)
      - `template_id` (uuid, references email_templates)
      - `sent_at` (timestamp)
      - `status` (text)

  2. Security
    - Enable RLS on both tables
    - Add policies for admin access
*/

-- Create email_templates table
CREATE TABLE email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings ON DELETE CASCADE,
  template_id uuid REFERENCES email_templates ON DELETE CASCADE,
  sent_at timestamptz DEFAULT now(),
  status text CHECK (status IN ('pending', 'sent', 'failed')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Email templates are viewable by admins only"
  ON email_templates FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Notifications are viewable by owner or admin"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');

-- Insert default email templates
INSERT INTO email_templates (name, subject, content) VALUES
('booking_confirmation', 'Potwierdzenie rezerwacji', 'Dziękujemy za rezerwację w naszym salonie. Twoja wizyta została zaplanowana na {{date}} o godzinie {{time}}. Usługa: {{service}}'),
('booking_reminder', 'Przypomnienie o wizycie', 'Przypominamy o jutrzejszej wizycie w naszym salonie o godzinie {{time}}. Usługa: {{service}}'),
('booking_cancelled', 'Anulowanie rezerwacji', 'Twoja rezerwacja na {{date}} została anulowana.');