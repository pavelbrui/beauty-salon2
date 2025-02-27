/*
  # Initial Schema Setup for Beauty Salon

  1. New Tables
    - services: Stores service information
      - id (uuid, primary key)
      - name (text)
      - category (text)
      - price (integer, in cents)
      - duration (integer, in minutes)
      - description (text, optional)
      
    - time_slots: Available appointment slots
      - id (uuid)
      - service_id (references services)
      - start_time (timestamptz)
      - end_time (timestamptz)
      - is_available (boolean)
      
    - bookings: Customer appointments
      - id (uuid)
      - service_id (references services)
      - user_id (references auth.users)
      - time_slot_id (references time_slots)
      - status (text)
      - created_at (timestamptz)
      
    - service_images: Images for services
      - id (uuid)
      - service_id (references services)
      - url (text)
      - alt_text (text)
      
  2. Security
    - Enable RLS on all tables
    - Add policies for admin and client access
*/

-- Create services table
CREATE TABLE services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  price integer NOT NULL,
  duration integer NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create time_slots table
CREATE TABLE time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create bookings table
CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  time_slot_id uuid REFERENCES time_slots ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- Create service_images table
CREATE TABLE service_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services ON DELETE CASCADE,
  url text NOT NULL,
  alt_text text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_images ENABLE ROW LEVEL SECURITY;

-- Create policies for services
CREATE POLICY "Services are viewable by everyone"
  ON services FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Services are editable by admins only"
  ON services FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Create policies for time_slots
CREATE POLICY "Time slots are viewable by everyone"
  ON time_slots FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Time slots are editable by admins only"
  ON time_slots FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Create policies for bookings
CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can create their own bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');

-- Create policies for service_images
CREATE POLICY "Service images are viewable by everyone"
  ON service_images FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service images are editable by admins only"
  ON service_images FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Insert initial services
INSERT INTO services (name, category, price, duration, description) VALUES
('Regulacja brwi + henna', 'Pielęgnacja brwi', 9000, 35, 'Profesjonalna regulacja brwi z henną'),
('Laminowanie brwi + henna + regulacja', 'Pielęgnacja brwi', 13000, 50, 'Kompletny zabieg pielęgnacji brwi'),
('Henna brwi + regulacja + botox', 'Pielęgnacja brwi', 10000, 60, 'Zabieg z dodatkiem botoxu'),
('Makijaż permanentny ust', 'Makijaż permanentny', 85000, 150, 'Trwały makijaż ust'),
('Makijaż permanentny brwi', 'Makijaż permanentny', 80000, 135, 'Makijaż permanentny brwi metodą pudrową'),
('Lifting rzęs', 'Rzęsy', 14000, 70, 'Lifting rzęs z botoxem i farbowaniem'),
('Laserowe usuwanie tatuażu', 'Laserowe usuwanie', 18000, 30, 'Usuwanie tatuażu laserem');