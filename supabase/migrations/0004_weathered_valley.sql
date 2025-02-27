/*
  # Add stylists table and related functionality

  1. New Tables
    - `stylists`
      - `id` (uuid, primary key)
      - `name` (text)
      - `role` (text)
      - `image_url` (text)
      - `specialties` (text[])
      - `description` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `stylists` table
    - Add policies for public viewing and admin management
*/

-- Create stylists table
CREATE TABLE stylists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  image_url text NOT NULL,
  specialties text[] NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE stylists ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Stylists are viewable by everyone"
  ON stylists FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Stylists are editable by admins only"
  ON stylists FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Insert initial stylists
INSERT INTO stylists (name, role, image_url, specialties, description) VALUES
('Katarzyna Brui', 'Founder & Master Specialist', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80', ARRAY['Permanent Makeup', 'Microblading', 'Brow Design'], 'With over 10 years of experience in permanent makeup and beauty treatments.'),
('Anna Kowalska', 'Senior Beautician', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=800&q=80', ARRAY['Lash Extensions', 'Brow Styling', 'Facial Treatments'], 'Specializing in lash extensions and facial treatments.'),
('Maria Nowak', 'Beauty Specialist', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80', ARRAY['Makeup', 'Skin Care', 'Beauty Consulting'], 'Expert in skincare and beauty treatments.');