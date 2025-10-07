-- Delete ALL streams and force clean slate
-- This ensures each user gets exactly ONE fresh stream

-- Step 1: Backup (just in case)
CREATE TABLE IF NOT EXISTS streams_backup_final AS
SELECT * FROM streams;

-- Step 2: Delete ALL existing streams
DELETE FROM streams;

-- Step 3: Verify cleanup
SELECT
  (SELECT COUNT(*) FROM streams) as remaining_streams,
  (SELECT COUNT(*) FROM streams_backup_final) as backed_up_streams;

-- Step 4: Verify users table
SELECT COUNT(*) as total_users FROM users;

-- Expected result: 0 remaining streams
-- Each user will get fresh stream on next studio load
