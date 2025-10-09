-- ============================================================================
-- CRITICAL FIX: Make viewer_profile_id nullable in chat_messages table
-- ============================================================================
--
-- PROBLEM:
-- The chat_messages.viewer_profile_id column has a NOT NULL constraint
-- But we're passing NULL for:
-- 1. Anonymous viewers (they don't have profiles)
-- 2. Host/streamer messages (streamer doesn't have viewer profile)
--
-- ERROR:
-- "null value in column "viewer_profile_id" of relation "chat_messages"
--  violates not-null constraint"
--
-- SOLUTION:
-- Make the column nullable. We use sender_id for identification instead.
--
-- ============================================================================

-- Make viewer_profile_id nullable
ALTER TABLE chat_messages
ALTER COLUMN viewer_profile_id DROP NOT NULL;

-- Verify the change
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'chat_messages'
  AND column_name = 'viewer_profile_id';

-- Expected result: is_nullable should be 'YES'

-- ============================================================================
-- TESTING AFTER MIGRATION
-- ============================================================================
--
-- After running this migration, test:
-- 1. Send message from viewer page → Should work (sender_id = viewerId)
-- 2. Send message from studio/host → Should work (sender_id = 'streamer')
-- 3. Verify messages appear in real-time for all parties
-- 4. Test private messages
-- 5. Test pinning
--
-- ============================================================================
