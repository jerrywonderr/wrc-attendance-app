-- Remove public insert policy for attendance_logs
-- Only service role should be able to insert attendance logs (via API routes)

DROP POLICY IF EXISTS "Public can insert attendance logs" ON attendance_logs;

