-- Enable Realtime for chat_messages table
-- This allows Supabase Realtime subscriptions to receive INSERT/UPDATE/DELETE events
-- Without this, messages only appear on page refresh

-- Step 1: Add table to Realtime publication
-- This tells PostgreSQL to publish changes from chat_messages to the Realtime server
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Step 2: Set REPLICA IDENTITY to FULL for complete event data
-- This ensures UPDATE and DELETE events include full row data (old and new values)
-- Without FULL, only the primary key is sent, which breaks UPDATE events
ALTER TABLE chat_messages REPLICA IDENTITY FULL;

-- Step 3: Verify Realtime is enabled
-- RLS policies are already permissive from previous migration (20250110000001_fix_chat_rls_for_anonymous.sql)
-- "Allow all reads for MVP" policy allows anon role to SELECT (required for Realtime subscriptions)

-- Add metadata comment
COMMENT ON TABLE chat_messages IS 'Realtime enabled for instant chat updates. RLS policies are permissive for MVP. Application-level filtering handles message privacy.';

-- Verification query (for manual testing in Supabase SQL Editor):
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages';
-- Should return 1 row confirming chat_messages is in the publication
