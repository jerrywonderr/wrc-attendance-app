-- Remove redundant columns that are no longer needed
ALTER TABLE attendees 
  DROP COLUMN IF EXISTS email,
  DROP COLUMN IF EXISTS program_batch,
  DROP COLUMN IF EXISTS church_group;

