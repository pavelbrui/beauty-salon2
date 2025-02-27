/*
  # Add Gallery Storage Bucket

  1. Storage
    - Create a new storage bucket for gallery images
    - Set up public access policies
  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create storage bucket for gallery images
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-images', 'service-images', true);

-- Create storage policy to allow public access to gallery images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'service-images');

-- Create storage policy to allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'service-images');

-- Create storage policy to allow authenticated users to update their images
CREATE POLICY "Authenticated users can update images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'service-images');

-- Create storage policy to allow authenticated users to delete their images
CREATE POLICY "Authenticated users can delete images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'service-images');