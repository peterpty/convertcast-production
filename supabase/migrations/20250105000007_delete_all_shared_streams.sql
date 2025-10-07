-- ============================================================================
-- Migration: Delete All Shared Streams (Nuclear Option)
-- Purpose: Force all users to get fresh unique streams
-- Date: 2025-10-05
-- WARNING: This deletes ALL existing stream records (but NOT Mux streams)
-- ============================================================================

-- Backup current streams before deletion (just in case)
CREATE TABLE IF NOT EXISTS streams_backup_20250105 AS
SELECT * FROM streams;

-- Delete all streams created before the fix
-- Users will automatically get new unique streams when they load the studio
DELETE FROM streams
WHERE created_at < '2025-10-05 12:00:00+00'::timestamptz;

-- Log the deletion
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO deleted_count FROM streams_backup_20250105;
  RAISE NOTICE 'Backed up % stream records', deleted_count;
  RAISE NOTICE 'All old streams deleted. Users will get new unique streams on next studio load.';
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check remaining streams
SELECT COUNT(*) as remaining_streams FROM streams;

-- Check backup
SELECT COUNT(*) as backed_up_streams FROM streams_backup_20250105;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. This deletes ALL old stream database records
-- 2. Mux streams in the cloud are NOT deleted (will be orphaned)
-- 3. Users will automatically get new streams when they open studio
-- 4. Backup table created: streams_backup_20250105
-- 5. Run this ONLY if stream key sharing persists after code fixes

-- ============================================================================
