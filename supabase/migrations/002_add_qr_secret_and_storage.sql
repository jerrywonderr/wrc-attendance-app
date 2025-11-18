-- Add qr_secret column to attendees for enhanced security
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS qr_secret TEXT;

-- Add columns for Supabase Storage URLs
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS qr_day1_image_url TEXT;
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS qr_day2_image_url TEXT;
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS qr_day3_image_url TEXT;
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS qr_day4_image_url TEXT;

-- Make email, program_batch, church_group nullable (they're optional now)
-- They're already nullable, but ensuring it's clear

-- Create a function to generate random secret
CREATE OR REPLACE FUNCTION generate_qr_secret() RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

