-- Create attendees table
CREATE TABLE IF NOT EXISTS attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  program_batch TEXT,
  church_group TEXT,
  qr_day1_url TEXT,
  qr_day2_url TEXT,
  qr_day3_url TEXT,
  qr_day4_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create attendance_logs table
CREATE TABLE IF NOT EXISTS attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendee_id UUID NOT NULL REFERENCES attendees(id) ON DELETE CASCADE,
  day SMALLINT NOT NULL CHECK (day >= 1 AND day <= 4),
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'rejected', 'tampered')),
  scanned_by TEXT,
  scan_time TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendees_uid ON attendees(uid);
CREATE INDEX IF NOT EXISTS idx_attendees_phone ON attendees(phone);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_attendee_id ON attendance_logs(attendee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_day ON attendance_logs(day);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_scan_time ON attendance_logs(scan_time);

-- Partial unique index: prevent more than one 'present' record per attendee per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_attendee_day_present
  ON attendance_logs(attendee_id, day)
  WHERE status = 'present';

-- Enable Row Level Security
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for attendees
-- Public (anon/authenticated) can read and insert; service_role has full access.

CREATE POLICY "Public can read attendees" ON attendees
  FOR SELECT
  USING (true);

CREATE POLICY "Public can insert attendees" ON attendees
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can manage attendees" ON attendees
  FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policies for attendance_logs
CREATE POLICY "Public can read attendance logs" ON attendance_logs
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage attendance logs" ON attendance_logs
  FOR ALL
  USING (auth.role() = 'service_role');