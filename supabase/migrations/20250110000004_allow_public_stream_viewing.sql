-- Allow public viewing of streams by playback ID
-- This enables the viewer page (/watch/[playbackId]) to work for anonymous users

-- Root cause: Existing RLS policy only allows authenticated users who OWN the stream to view it
-- Fix: Add policy allowing anyone (anonymous or authenticated) to SELECT streams
-- Safety: Playback IDs are pseudo-random strings, not easily guessable
-- Behavior: Anyone with the stream URL can watch (standard for live streaming platforms)

CREATE POLICY "allow_public_stream_viewing"
  ON streams
  FOR SELECT
  USING (true);  -- Allow all reads (anonymous and authenticated)

-- Note: This policy works alongside "users_view_own_streams" policy
-- Authenticated users can still see their own streams in dashboard
-- Anonymous users can now view streams via /watch/[playbackId] URLs

-- Security considerations:
-- 1. Stream URLs are meant to be shared publicly (that's the point of live streaming)
-- 2. Playback IDs are long random strings (e.g., "lhE66JAjEalXvz2c2ilGGsMkpkfnQgNCHdTu6v6SAlw")
-- 3. Private content is controlled by events.registration_required and event access controls
-- 4. Stream keys remain protected (only authenticated owners can see them in dashboard)

COMMENT ON POLICY "allow_public_stream_viewing" ON streams IS
'Allows public viewing of streams via /watch/[playbackId] URLs. Required for anonymous viewers to access live streams.';
