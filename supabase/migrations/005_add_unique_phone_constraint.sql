-- Add unique constraint on phone number to prevent multiple registrations
ALTER TABLE attendees ADD CONSTRAINT unique_phone UNIQUE (phone);

