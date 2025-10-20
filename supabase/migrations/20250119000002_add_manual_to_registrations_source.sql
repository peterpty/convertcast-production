-- Add 'manual' to allowed source values in registrations table
-- Created: 2025-01-19
-- Issue: CHECK constraint only allows 'email', 'sms', 'social'
-- Solution: Update constraint to include 'manual' for host-added attendees

-- Root cause: Original schema didn't account for manual attendee addition by hosts
-- The AttendeeManagement component sends source='manual' when hosts add attendees
-- This is a valid use case that needs to be supported

-- Step 1: Drop the existing CHECK constraint
ALTER TABLE registrations
  DROP CONSTRAINT IF EXISTS registrations_source_check;

-- Step 2: Recreate the constraint with 'manual' included
ALTER TABLE registrations
  ADD CONSTRAINT registrations_source_check
  CHECK (source IN ('email', 'sms', 'social', 'manual'));

-- Add comment for documentation
COMMENT ON CONSTRAINT registrations_source_check ON registrations IS
'Allowed registration sources: email (registration form), sms (SMS invite), social (social media), manual (added by host)';

-- Migration complete
-- Now supports:
-- - 'email': User registered via email form
-- - 'sms': User registered via SMS invite
-- - 'social': User registered via social media
-- - 'manual': Host manually added the attendee
