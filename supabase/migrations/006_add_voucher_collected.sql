-- Add voucher_collected column to track if attendee has collected their voucher
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS voucher_collected BOOLEAN DEFAULT FALSE;
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS voucher_collected_at TIMESTAMPTZ;

-- Add index for filtering collected vouchers
CREATE INDEX IF NOT EXISTS idx_attendees_voucher_collected ON attendees(voucher_collected);

