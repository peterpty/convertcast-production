-- Migration: Add Private Messages Support to Chat
-- Adds is_private and sender_id columns to chat_messages table
-- Created: 2025-01-10

-- Add is_private column to track private messages
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE NOT NULL;

-- Add sender_id column to track who sent the message
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS sender_id TEXT;

-- Add index for faster filtering of private messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_private
ON chat_messages(stream_id, is_private, created_at DESC);

-- Add index for sender filtering
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender
ON chat_messages(sender_id, stream_id, created_at DESC);

-- Update RLS policies for private messages
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all to read chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Allow authenticated users to insert chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Allow users to update their own chat messages" ON chat_messages;

-- Policy 1: Allow reading public messages or own private messages
-- Viewers can see: all public messages + their own private messages
CREATE POLICY "Allow reading public messages and own private messages"
ON chat_messages FOR SELECT
USING (
  is_private = FALSE
  OR sender_id = auth.uid()::text
  OR sender_id = (SELECT id::text FROM auth.users WHERE id = auth.uid())
);

-- Policy 2: Allow authenticated users to insert messages
CREATE POLICY "Allow authenticated users to insert messages"
ON chat_messages FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 3: Allow users to update only their own messages
CREATE POLICY "Allow users to update their own messages"
ON chat_messages FOR UPDATE
USING (sender_id = auth.uid()::text OR sender_id = (SELECT id::text FROM auth.users WHERE id = auth.uid()));

-- Policy 4: Allow users to delete only their own messages
CREATE POLICY "Allow users to delete their own messages"
ON chat_messages FOR DELETE
USING (sender_id = auth.uid()::text OR sender_id = (SELECT id::text FROM auth.users WHERE id = auth.uid()));

-- Comment the table for documentation
COMMENT ON COLUMN chat_messages.is_private IS 'TRUE if message is private (only visible to sender and host)';
COMMENT ON COLUMN chat_messages.sender_id IS 'User ID or session ID of the message sender';
