-- Fix viewer_profiles phone field to be nullable
-- This allows attendee registration without phone number

ALTER TABLE viewer_profiles
ALTER COLUMN phone DROP NOT NULL;

COMMENT ON COLUMN viewer_profiles.phone IS 'Phone number (optional) - not all registrants will provide phone';
