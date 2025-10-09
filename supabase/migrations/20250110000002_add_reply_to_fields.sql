-- Migration: Add Reply-To Fields for Bi-Directional Private Messaging
-- Allows host to reply privately to specific viewers
-- Created: 2025-01-10

-- Add reply_to_user_id to track which user this message is replying to
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS reply_to_user_id TEXT;

-- Add reply_to_message_id for threading context (optional, shows which message is being replied to)
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS reply_to_message_id TEXT;

-- Add index for querying conversations between host and specific viewer
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to
ON chat_messages(stream_id, reply_to_user_id, created_at DESC);

-- Add index for threading (finding replies to a specific message)
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread
ON chat_messages(reply_to_message_id);

-- Add comment explaining the fields
COMMENT ON COLUMN chat_messages.reply_to_user_id IS 'User ID this message is replying to. Used for bi-directional private messaging.';
COMMENT ON COLUMN chat_messages.reply_to_message_id IS 'Message ID this is replying to. Used for threading context.';
