-- Allow public viewing of events for anonymous stream viewers
-- This completes the fix started in 20250110000004_allow_public_stream_viewing.sql
-- Created: 2025-01-10

-- Root cause: RLS policy "users_view_own_events" blocks anonymous viewers
-- When viewer page queries streams and joins events, the join fails for anonymous users
-- Fix: Add policy allowing anyone (anonymous or authenticated) to SELECT events
-- Safety: Event metadata (title, description, etc.) is meant to be public for live streaming

CREATE POLICY "allow_public_event_viewing"
  ON events
  FOR SELECT
  USING (true);  -- Allow all reads (anonymous and authenticated)

-- Note: This policy works alongside "users_view_own_events" policy
-- Authenticated users can still manage their own events
-- Anonymous users can now view event metadata when watching streams

COMMENT ON POLICY "allow_public_event_viewing" ON events IS
'Allows public viewing of event metadata. Required for anonymous viewers to access /watch/[playbackId] pages when stream data includes event details via JOIN.';
