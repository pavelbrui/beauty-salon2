-- Add email field to stylists for booking notifications
ALTER TABLE stylists ADD COLUMN IF NOT EXISTS email text;
