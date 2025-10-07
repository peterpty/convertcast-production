-- ====================================================================
-- ConvertCast Event Notification System Migration (FIXED)
-- Version: 1.0.0
-- Date: 2025-01-05
-- Handles existing tables and type mismatches safely
-- ====================================================================

-- ============================================
-- STEP 1: Update events table
-- ============================================

ALTER TABLE events
ADD COLUMN IF NOT EXISTS registration_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS registration_url TEXT,
ADD COLUMN IF NOT EXISTS max_registrations INTEGER,
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{"email_enabled": true, "sms_enabled": false, "auto_schedule": true}'::jsonb;

-- ============================================
-- STEP 2: Drop existing tables (clean slate)
-- ============================================

-- Drop dependent objects first
DROP VIEW IF EXISTS event_performance_summary CASCADE;
DROP TABLE IF EXISTS event_notifications CASCADE;
DROP TABLE IF EXISTS event_analytics CASCADE;

-- ============================================
-- STEP 3: Create event_notifications table (fresh)
-- ============================================

CREATE TABLE event_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('email', 'sms', 'both')),
  notification_timing TEXT NOT NULL,
  scheduled_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sending', 'sent', 'failed', 'cancelled')),
  template_name TEXT NOT NULL,
  recipients_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_event_notifications_event_id ON event_notifications(event_id);
CREATE INDEX idx_event_notifications_scheduled_time ON event_notifications(scheduled_time);
CREATE INDEX idx_event_notifications_status ON event_notifications(status);
CREATE INDEX idx_event_notifications_status_scheduled ON event_notifications(status, scheduled_time) WHERE status = 'scheduled';

-- ============================================
-- STEP 4: Create event_analytics table (fresh)
-- ============================================

CREATE TABLE event_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL UNIQUE REFERENCES events(id) ON DELETE CASCADE,
  total_registrations INTEGER DEFAULT 0,
  email_registrations INTEGER DEFAULT 0,
  sms_registrations INTEGER DEFAULT 0,
  social_registrations INTEGER DEFAULT 0,
  notifications_sent INTEGER DEFAULT 0,
  notifications_opened INTEGER DEFAULT 0,
  notifications_clicked INTEGER DEFAULT 0,
  viewers_attended INTEGER DEFAULT 0,
  peak_concurrent_viewers INTEGER DEFAULT 0,
  total_engagement_actions INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0.00,
  conversion_rate DECIMAL(5,2) DEFAULT 0.00,
  average_watch_time INTEGER DEFAULT 0,
  registration_to_attendance_rate DECIMAL(5,2) DEFAULT 0.00,
  event_started_at TIMESTAMPTZ,
  event_ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_event_analytics_event_id ON event_analytics(event_id);

-- ============================================
-- STEP 5: Functions
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_event_notifications_updated_at
  BEFORE UPDATE ON event_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_analytics_updated_at
  BEFORE UPDATE ON event_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION create_event_analytics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO event_analytics (event_id)
  VALUES (NEW.id)
  ON CONFLICT (event_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_event_analytics_trigger
  AFTER INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION create_event_analytics();

-- ============================================
-- STEP 6: Helper Functions
-- ============================================

CREATE OR REPLACE FUNCTION increment_analytics_counter(
  p_event_id UUID,
  p_counter_name TEXT,
  p_increment INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('
    UPDATE event_analytics
    SET %I = COALESCE(%I, 0) + $1,
        updated_at = NOW()
    WHERE event_id = $2::uuid
  ', p_counter_name, p_counter_name)
  USING p_increment, p_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION calculate_attendance_rate(p_event_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_rate DECIMAL;
BEGIN
  SELECT
    CASE
      WHEN total_registrations > 0 THEN
        ROUND((viewers_attended::DECIMAL / total_registrations::DECIMAL) * 100, 2)
      ELSE 0
    END
  INTO v_rate
  FROM event_analytics
  WHERE event_id = p_event_id;

  RETURN COALESCE(v_rate, 0);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION track_notification_open(
  p_notification_id UUID,
  p_viewer_profile_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE event_notifications
  SET opened_count = opened_count + 1,
      updated_at = NOW()
  WHERE id = p_notification_id;

  UPDATE event_analytics ea
  SET notifications_opened = notifications_opened + 1,
      updated_at = NOW()
  FROM event_notifications en
  WHERE en.id = p_notification_id
  AND ea.event_id = en.event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION track_notification_click(
  p_notification_id UUID,
  p_viewer_profile_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE event_notifications
  SET clicked_count = clicked_count + 1,
      updated_at = NOW()
  WHERE id = p_notification_id;

  UPDATE event_analytics ea
  SET notifications_clicked = notifications_clicked + 1,
      updated_at = NOW()
  FROM event_notifications en
  WHERE en.id = p_notification_id
  AND ea.event_id = en.event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 7: View
-- ============================================

CREATE VIEW event_performance_summary AS
SELECT
  e.id,
  e.title,
  e.scheduled_start,
  e.status,
  e.user_id,
  ea.total_registrations,
  ea.viewers_attended,
  ea.registration_to_attendance_rate,
  ea.notifications_sent,
  ea.notifications_opened,
  CASE
    WHEN ea.notifications_sent > 0 THEN
      ROUND((ea.notifications_opened::DECIMAL / ea.notifications_sent::DECIMAL) * 100, 2)
    ELSE 0
  END as notification_open_rate,
  ea.total_revenue,
  ea.conversion_rate,
  ea.peak_concurrent_viewers
FROM events e
LEFT JOIN event_analytics ea ON e.id = ea.event_id
ORDER BY e.scheduled_start DESC;

-- ============================================
-- STEP 8: RLS Policies
-- ============================================

ALTER TABLE event_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notifications for their events"
  ON event_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_notifications.event_id
      AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create notifications for their events"
  ON event_notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_notifications.event_id
      AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update notifications for their events"
  ON event_notifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_notifications.event_id
      AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view analytics for their events"
  ON event_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_analytics.event_id
      AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update analytics for their events"
  ON event_analytics FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_analytics.event_id
      AND events.user_id = auth.uid()
    )
  );

-- ============================================
-- STEP 9: Grant Permissions
-- ============================================

GRANT EXECUTE ON FUNCTION increment_analytics_counter(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_attendance_rate(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION track_notification_open(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION track_notification_click(UUID, UUID) TO authenticated;
GRANT SELECT ON event_performance_summary TO authenticated;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

COMMENT ON TABLE event_notifications IS 'Stores scheduled event notifications with tracking metrics';
COMMENT ON TABLE event_analytics IS 'Comprehensive analytics for each event including registrations and engagement';
