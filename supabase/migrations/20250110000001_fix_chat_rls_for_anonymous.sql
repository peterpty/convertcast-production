-- Migration: Fix Chat RLS Policies for Anonymous Viewers
-- Remove auth-based policies and make them permissive for application-level filtering
-- Created: 2025-01-10

-- Drop all existing chat_messages policies
DROP POLICY IF EXISTS "Allow reading public messages and own private messages" ON chat_messages;
DROP POLICY IF EXISTS "Allow authenticated users to insert messages" ON chat_messages;
DROP POLICY IF EXISTS "Allow users to update their own messages" ON chat_messages;
DROP POLICY IF EXISTS "Allow users to delete their own messages" ON chat_messages;

-- TEMPORARY PERMISSIVE POLICIES FOR MVP
-- These allow application-level filtering to work
-- TODO: Replace with proper authentication-based policies before production launch

-- Policy 1: Allow all reads (application filters private messages)
CREATE POLICY "Allow all reads for MVP"
ON chat_messages FOR SELECT
USING (true);

-- Policy 2: Allow all inserts (we validate on application side)
CREATE POLICY "Allow all inserts for MVP"
ON chat_messages FOR INSERT
WITH CHECK (true);

-- Policy 3: Allow all updates (only host should update via application)
CREATE POLICY "Allow all updates for MVP"
ON chat_messages FOR UPDATE
USING (true);

-- Policy 4: Allow all deletes (only host should delete via application)
CREATE POLICY "Allow all deletes for MVP"
ON chat_messages FOR DELETE
USING (true);

-- Add warning comment
COMMENT ON TABLE chat_messages IS 'WARNING: RLS policies are permissive for MVP. Application-level filtering is used for privacy. Must implement proper authentication before production launch.';
