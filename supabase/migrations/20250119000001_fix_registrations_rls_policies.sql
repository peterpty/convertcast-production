-- Fix RLS policies for registrations table
-- Created: 2025-01-19
-- Issue: "FOR ALL" policy with only USING clause blocks INSERT operations
-- Solution: Create explicit policies with WITH CHECK clause for INSERT

-- Root cause: The existing "FOR ALL" policy doesn't properly handle INSERT operations
-- PostgreSQL best practice: Use separate policies for SELECT, INSERT, UPDATE, DELETE
-- WITH CHECK clause is required for INSERT to validate new rows

-- Step 1: Drop the existing overly-restrictive policy
DROP POLICY IF EXISTS "Registrations viewable via events" ON registrations;

-- Step 2: Create explicit SELECT policy
-- Allows users to view registrations for events they own
CREATE POLICY "users_can_view_registrations_for_own_events"
  ON registrations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = registrations.event_id
      AND events.user_id = auth.uid()
    )
  );

-- Step 3: Create explicit INSERT policy with WITH CHECK
-- Allows users to create registrations for events they own
-- WITH CHECK ensures the new row passes the permission check
CREATE POLICY "users_can_create_registrations_for_own_events"
  ON registrations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_id
      AND events.user_id = auth.uid()
    )
  );

-- Step 4: Create explicit UPDATE policy
-- Allows users to update registrations for events they own
CREATE POLICY "users_can_update_registrations_for_own_events"
  ON registrations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = registrations.event_id
      AND events.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_id
      AND events.user_id = auth.uid()
    )
  );

-- Step 5: Create explicit DELETE policy
-- Allows users to delete registrations for events they own
CREATE POLICY "users_can_delete_registrations_for_own_events"
  ON registrations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = registrations.event_id
      AND events.user_id = auth.uid()
    )
  );

-- Add comments for documentation
COMMENT ON POLICY "users_can_view_registrations_for_own_events" ON registrations IS
'Allows event owners to SELECT registrations for their events';

COMMENT ON POLICY "users_can_create_registrations_for_own_events" ON registrations IS
'Allows event owners to INSERT new registrations for their events. WITH CHECK clause validates new rows.';

COMMENT ON POLICY "users_can_update_registrations_for_own_events" ON registrations IS
'Allows event owners to UPDATE registrations for their events';

COMMENT ON POLICY "users_can_delete_registrations_for_own_events" ON registrations IS
'Allows event owners to DELETE registrations for their events';

-- Migration complete
-- Benefits:
-- 1. Explicit INSERT permission with WITH CHECK clause
-- 2. Separate policies for each operation (easier to debug and maintain)
-- 3. Clear permission model following PostgreSQL best practices
