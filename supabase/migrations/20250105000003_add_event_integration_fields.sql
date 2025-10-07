-- Migration: Add integration fields to events table
-- This allows events to reference a preferred integration and selected contacts

-- Add columns to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS preferred_integration_id UUID REFERENCES user_integrations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS selected_contact_ids UUID[];

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_events_preferred_integration
  ON events(preferred_integration_id)
  WHERE preferred_integration_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN events.preferred_integration_id IS 'Reference to the user integration to use for sending notifications';
COMMENT ON COLUMN events.selected_contact_ids IS 'Array of integration_contacts.id that should receive notifications';
