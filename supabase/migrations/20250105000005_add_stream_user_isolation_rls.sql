-- Migration: Add RLS Policies for User Stream Isolation
-- Purpose: Fix critical bug where all users shared the same stream key
-- Date: 2025-10-05
-- Issue: Production-breaking security flaw affecting 250+ users

-- ============================================================================
-- STEP 1: Enable Row Level Security on critical tables
-- ============================================================================

-- Enable RLS on events table (if not already enabled)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Enable RLS on streams table (if not already enabled)
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Create RLS Policies for Events Table
-- ============================================================================

-- Policy: Users can view only their own events
CREATE POLICY "users_view_own_events"
  ON events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert only their own events
CREATE POLICY "users_insert_own_events"
  ON events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update only their own events
CREATE POLICY "users_update_own_events"
  ON events
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete only their own events
CREATE POLICY "users_delete_own_events"
  ON events
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 3: Create RLS Policies for Streams Table
-- ============================================================================

-- Policy: Users can view only streams from their own events
CREATE POLICY "users_view_own_streams"
  ON streams
  FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert only streams for their own events
CREATE POLICY "users_insert_own_streams"
  ON streams
  FOR INSERT
  WITH CHECK (
    event_id IN (
      SELECT id FROM events WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update only streams from their own events
CREATE POLICY "users_update_own_streams"
  ON streams
  FOR UPDATE
  USING (
    event_id IN (
      SELECT id FROM events WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    event_id IN (
      SELECT id FROM events WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete only streams from their own events
CREATE POLICY "users_delete_own_streams"
  ON streams
  FOR DELETE
  USING (
    event_id IN (
      SELECT id FROM events WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 4: Create indexes for RLS performance
-- ============================================================================

-- Index to speed up RLS policy checks on events
CREATE INDEX IF NOT EXISTS idx_events_user_id_status
  ON events(user_id, status);

-- Index to speed up RLS policy checks on streams
CREATE INDEX IF NOT EXISTS idx_streams_event_id_status
  ON streams(event_id, status);

-- ============================================================================
-- VERIFICATION QUERIES (Run these to test)
-- ============================================================================

-- Verify RLS is enabled:
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- AND tablename IN ('events', 'streams');

-- Verify policies exist:
-- SELECT tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- AND tablename IN ('events', 'streams');

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. These policies ensure users can ONLY see/modify their own streams
-- 2. Database-level security prevents API bugs from exposing other users' data
-- 3. All queries now automatically filter by user_id through RLS
-- 4. Service role key bypasses RLS for admin operations
-- 5. This fixes the critical bug where /api/mux/stream/latest returned global streams

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- To disable RLS (NOT RECOMMENDED in production):
-- ALTER TABLE events DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE streams DISABLE ROW LEVEL SECURITY;

-- To drop policies:
-- DROP POLICY IF EXISTS "users_view_own_events" ON events;
-- DROP POLICY IF EXISTS "users_insert_own_events" ON events;
-- DROP POLICY IF EXISTS "users_update_own_events" ON events;
-- DROP POLICY IF EXISTS "users_delete_own_events" ON events;
-- DROP POLICY IF EXISTS "users_view_own_streams" ON streams;
-- DROP POLICY IF EXISTS "users_insert_own_streams" ON streams;
-- DROP POLICY IF EXISTS "users_update_own_streams" ON streams;
-- DROP POLICY IF EXISTS "users_delete_own_streams" ON streams;
