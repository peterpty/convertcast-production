-- Event Scheduling and Notification System
-- Non-breaking migration - only adds new tables

-- Table: event_registrations
-- Stores viewer registrations for events (email/SMS)
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES viewer_profiles(id) ON DELETE SET NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  registration_source VARCHAR(50) DEFAULT 'website', -- website, landing_page, social
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  opted_in_email BOOLEAN DEFAULT TRUE,
  opted_in_sms BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Ensure at least one contact method
  CONSTRAINT check_contact_method CHECK (email IS NOT NULL OR phone IS NOT NULL),

  -- Prevent duplicate registrations
  UNIQUE(event_id, email),
  UNIQUE(event_id, phone)
);

-- Table: event_notifications
-- Scheduled notifications for events
CREATE TABLE IF NOT EXISTS event_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  notification_type VARCHAR(20) NOT NULL, -- email, sms, both
  notification_timing VARCHAR(50) NOT NULL, -- now, 1_week_before, 3_days_before, etc.
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, sending, sent, failed, cancelled
  recipient_count INTEGER DEFAULT 0,
  successful_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  template_name VARCHAR(100),
  template_data JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: event_analytics
-- Detailed event performance tracking
CREATE TABLE IF NOT EXISTS event_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  stream_id UUID REFERENCES streams(id) ON DELETE SET NULL,

  -- Registration metrics
  total_registrations INTEGER DEFAULT 0,
  email_registrations INTEGER DEFAULT 0,
  sms_registrations INTEGER DEFAULT 0,

  -- Notification metrics
  notifications_scheduled INTEGER DEFAULT 0,
  notifications_sent INTEGER DEFAULT 0,
  notifications_failed INTEGER DEFAULT 0,
  email_open_rate DECIMAL(5,2),
  email_click_rate DECIMAL(5,2),
  sms_delivery_rate DECIMAL(5,2),

  -- Viewership metrics
  total_viewers INTEGER DEFAULT 0,
  peak_concurrent_viewers INTEGER DEFAULT 0,
  registered_viewers_attended INTEGER DEFAULT 0,
  attendance_rate DECIMAL(5,2),
  average_watch_duration INTEGER, -- seconds

  -- Engagement metrics
  total_reactions INTEGER DEFAULT 0,
  total_chat_messages INTEGER DEFAULT 0,
  poll_participation_rate DECIMAL(5,2),

  -- Revenue metrics (for future use)
  conversion_count INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2),
  total_revenue DECIMAL(10,2),

  -- Timing
  event_started_at TIMESTAMP WITH TIME ZONE,
  event_ended_at TIMESTAMP WITH TIME ZONE,
  actual_duration INTEGER, -- seconds

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- One analytics record per event
  UNIQUE(event_id)
);

-- Table: notification_templates
-- Email/SMS templates for notifications
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL, -- email, sms
  subject VARCHAR(255), -- for email
  body TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb, -- Available template variables
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, name, type)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_email ON event_registrations(email);
CREATE INDEX IF NOT EXISTS idx_event_registrations_phone ON event_registrations(phone);
CREATE INDEX IF NOT EXISTS idx_event_notifications_event ON event_notifications(event_id);
CREATE INDEX IF NOT EXISTS idx_event_notifications_scheduled ON event_notifications(scheduled_time, status);
CREATE INDEX IF NOT EXISTS idx_event_analytics_event ON event_analytics(event_id);
CREATE INDEX IF NOT EXISTS idx_notification_templates_user ON notification_templates(user_id);

-- Add new columns to existing events table (non-breaking)
ALTER TABLE events ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{
  "email_enabled": true,
  "sms_enabled": false,
  "auto_schedule": true,
  "custom_message": null
}'::jsonb;

ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_url VARCHAR(500);
ALTER TABLE events ADD COLUMN IF NOT EXISTS max_registrations INTEGER;

-- Function to automatically create analytics record
CREATE OR REPLACE FUNCTION create_event_analytics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO event_analytics (event_id)
  VALUES (NEW.id)
  ON CONFLICT (event_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create analytics on event creation
DROP TRIGGER IF EXISTS trigger_create_event_analytics ON events;
CREATE TRIGGER trigger_create_event_analytics
  AFTER INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION create_event_analytics();

-- Function to update analytics timestamp
CREATE OR REPLACE FUNCTION update_analytics_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamps
DROP TRIGGER IF EXISTS trigger_update_event_analytics ON event_analytics;
CREATE TRIGGER trigger_update_event_analytics
  BEFORE UPDATE ON event_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_timestamp();

DROP TRIGGER IF EXISTS trigger_update_event_notifications ON event_notifications;
CREATE TRIGGER trigger_update_event_notifications
  BEFORE UPDATE ON event_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_timestamp();

-- Insert default templates
INSERT INTO notification_templates (user_id, name, type, subject, body, variables, is_default)
SELECT
  id as user_id,
  'Default Event Reminder' as name,
  'email' as type,
  '🎬 Your stream "{{event_title}}" starts {{time_until}}' as subject,
  E'Hi {{first_name}},\n\nThis is a reminder that "{{event_title}}" is starting {{time_until}}.\n\n📅 Date: {{event_date}}\n⏰ Time: {{event_time}}\n🔗 Watch here: {{stream_url}}\n\nSee you there!\n\n{{streamer_name}}' as body,
  '["event_title", "time_until", "event_date", "event_time", "stream_url", "streamer_name", "first_name"]'::jsonb as variables,
  TRUE as is_default
FROM users
ON CONFLICT (user_id, name, type) DO NOTHING;

INSERT INTO notification_templates (user_id, name, type, subject, body, variables, is_default)
SELECT
  id as user_id,
  'Default Event Reminder' as name,
  'sms' as type,
  NULL as subject,
  '🎬 {{event_title}} starts {{time_until}}! Join: {{stream_url}}' as body,
  '["event_title", "time_until", "stream_url"]'::jsonb as variables,
  TRUE as is_default
FROM users
ON CONFLICT (user_id, name, type) DO NOTHING;

-- Add RLS policies
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- Users can view registrations for their own events
CREATE POLICY "Users can view their event registrations"
  ON event_registrations FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events WHERE user_id = auth.uid()
    )
  );

-- Users can manage notifications for their own events
CREATE POLICY "Users can manage their event notifications"
  ON event_notifications FOR ALL
  USING (
    event_id IN (
      SELECT id FROM events WHERE user_id = auth.uid()
    )
  );

-- Users can view analytics for their own events
CREATE POLICY "Users can view their event analytics"
  ON event_analytics FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events WHERE user_id = auth.uid()
    )
  );

-- Users can manage their own templates
CREATE POLICY "Users can manage their own templates"
  ON notification_templates FOR ALL
  USING (user_id = auth.uid());

-- Public registration (viewers can register for any public event)
CREATE POLICY "Anyone can register for public events"
  ON event_registrations FOR INSERT
  WITH CHECK (
    event_id IN (
      SELECT id FROM events WHERE status IN ('scheduled', 'live')
    )
  );

COMMENT ON TABLE event_registrations IS 'Viewer registrations for scheduled events via email or SMS';
COMMENT ON TABLE event_notifications IS 'Scheduled and sent notifications for events';
COMMENT ON TABLE event_analytics IS 'Comprehensive analytics for each event';
COMMENT ON TABLE notification_templates IS 'Customizable email and SMS templates for event notifications';
