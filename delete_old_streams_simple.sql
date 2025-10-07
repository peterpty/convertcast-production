-- Simple script to delete all streams created before the fix
-- This forces all users to get fresh unique streams on next studio load
-- Run this in Supabase SQL editor

-- Delete all streams created before the fix (2025-10-05 6pm)
DELETE FROM streams
WHERE created_at < '2025-10-05 18:00:00+00'::timestamptz;

-- Check how many remain
SELECT
  COUNT(*) as remaining_streams,
  MIN(created_at) as oldest_stream,
  MAX(created_at) as newest_stream
FROM streams;
