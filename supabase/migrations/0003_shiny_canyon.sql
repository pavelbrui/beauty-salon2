/*
  # Storage system for service images

  1. New Tables
    - `storage_files` - Stores metadata about uploaded files
      - `id` (uuid, primary key)
      - `filename` (text)
      - `content_type` (text)
      - `size` (bigint)
      - `url` (text)
      - `uploaded_by` (uuid, references auth.users)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on storage_files table
    - Add policies for public read access
    - Add policies for admin-only write access
*/

-- Create storage_files table
CREATE TABLE storage_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  content_type text,
  size bigint,
  url text NOT NULL,
  uploaded_by uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE storage_files ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Files are publicly accessible"
  ON storage_files FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only admins can upload files"
  ON storage_files FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can update files"
  ON storage_files FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can delete files"
  ON storage_files FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Add index for faster lookups
CREATE INDEX idx_storage_files_uploaded_by ON storage_files(uploaded_by);