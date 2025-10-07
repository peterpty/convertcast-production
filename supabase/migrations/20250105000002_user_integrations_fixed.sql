-- ====================================================================
-- ConvertCast User Integrations System Migration (FIXED)
-- Version: 1.0.1
-- Date: 2025-01-05
-- Description: Complete integration system for email/SMS services
-- Each streamer brings their own API keys and billing
-- ====================================================================

-- ============================================
-- STEP 1: user_integrations table
-- ============================================

CREATE TABLE IF NOT EXISTS user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Service identification
  service_type TEXT NOT NULL CHECK (service_type IN (
    'mailchimp', 'mailgun', 'sendgrid', 'brevo', 'custom_smtp',
    'twilio', 'whatsapp_business', 'telegram'
  )),
  service_name TEXT NOT NULL, -- User-friendly name like "My Mailchimp Account"

  -- Credentials (encrypted with AES-256)
  api_key_encrypted TEXT,
  api_secret_encrypted TEXT,
  oauth_token_encrypted TEXT,
  sender_email TEXT, -- For email services
  sender_phone TEXT, -- For SMS services

  -- Configuration (service-specific settings)
  configuration JSONB DEFAULT '{}',
  capabilities JSONB DEFAULT '{"email": false, "sms": false}',

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed', 'disabled')),
  is_active BOOLEAN DEFAULT false,
  is_primary BOOLEAN DEFAULT false, -- Primary integration for this service type

  -- Usage tracking
  total_sent INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  last_error TEXT,
  last_error_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create partial unique index for primary integrations
-- Only one primary integration per service type per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_integrations_primary
  ON user_integrations(user_id, service_type)
  WHERE is_primary = true;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_integrations_user_id ON user_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_service_type ON user_integrations(service_type);
CREATE INDEX IF NOT EXISTS idx_user_integrations_status ON user_integrations(status);
CREATE INDEX IF NOT EXISTS idx_user_integrations_is_active ON user_integrations(is_active) WHERE is_active = true;

-- ============================================
-- STEP 2: integration_contacts table
-- ============================================

CREATE TABLE IF NOT EXISTS integration_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES user_integrations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Contact information
  external_id TEXT, -- ID from external service (Mailchimp contact ID, etc.)
  email TEXT,
  phone TEXT,
  first_name TEXT,
  last_name TEXT,

  -- Categorization
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  lists JSONB DEFAULT '[]', -- [{id: "abc", name: "Newsletter Subscribers"}]
  custom_fields JSONB DEFAULT '{}',

  -- Sync status
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'error')),
  synced_at TIMESTAMPTZ DEFAULT NOW(),

  -- Consent & compliance (GDPR, CAN-SPAM, TCPA)
  consent_email BOOLEAN DEFAULT true,
  consent_sms BOOLEAN DEFAULT false,
  consent_date TIMESTAMPTZ,
  consent_ip TEXT,
  opt_out_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique per integration + external ID
  UNIQUE(integration_id, external_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_integration_contacts_integration_id ON integration_contacts(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_contacts_user_id ON integration_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_integration_contacts_email ON integration_contacts(email);
CREATE INDEX IF NOT EXISTS idx_integration_contacts_phone ON integration_contacts(phone);
CREATE INDEX IF NOT EXISTS idx_integration_contacts_sync_status ON integration_contacts(sync_status);
CREATE INDEX IF NOT EXISTS idx_integration_contacts_consent ON integration_contacts(consent_email, consent_sms) WHERE opt_out_at IS NULL;

-- ============================================
-- STEP 3: integration_usage_logs table
-- ============================================

CREATE TABLE IF NOT EXISTS integration_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES user_integrations(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,

  -- Usage details
  operation_type TEXT NOT NULL CHECK (operation_type IN (
    'send_email', 'send_sms', 'sync_contacts', 'test_connection'
  )),
  recipient_count INTEGER DEFAULT 1,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,

  -- Cost tracking (estimated based on service pricing)
  estimated_cost_usd DECIMAL(10,4) DEFAULT 0,

  -- Metadata (service response, error details, etc.)
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for analytics
CREATE INDEX IF NOT EXISTS idx_integration_usage_logs_user_id ON integration_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_integration_usage_logs_integration_id ON integration_usage_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_usage_logs_event_id ON integration_usage_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_integration_usage_logs_operation_type ON integration_usage_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_integration_usage_logs_created_at ON integration_usage_logs(created_at);

-- ============================================
-- STEP 4: Triggers for updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_integrations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_user_integrations_updated_at'
  ) THEN
    CREATE TRIGGER update_user_integrations_updated_at
      BEFORE UPDATE ON user_integrations
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Trigger for integration_contacts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_integration_contacts_updated_at'
  ) THEN
    CREATE TRIGGER update_integration_contacts_updated_at
      BEFORE UPDATE ON integration_contacts
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================
-- STEP 5: Row Level Security (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_usage_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view their own integrations" ON user_integrations;
  DROP POLICY IF EXISTS "Users can create their own integrations" ON user_integrations;
  DROP POLICY IF EXISTS "Users can update their own integrations" ON user_integrations;
  DROP POLICY IF EXISTS "Users can delete their own integrations" ON user_integrations;
END $$;

-- user_integrations policies
CREATE POLICY "Users can view their own integrations"
  ON user_integrations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own integrations"
  ON user_integrations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own integrations"
  ON user_integrations FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own integrations"
  ON user_integrations FOR DELETE
  USING (user_id = auth.uid());

-- Drop existing policies for integration_contacts
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view their own contacts" ON integration_contacts;
  DROP POLICY IF EXISTS "Users can create their own contacts" ON integration_contacts;
  DROP POLICY IF EXISTS "Users can update their own contacts" ON integration_contacts;
  DROP POLICY IF EXISTS "Users can delete their own contacts" ON integration_contacts;
END $$;

-- integration_contacts policies
CREATE POLICY "Users can view their own contacts"
  ON integration_contacts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own contacts"
  ON integration_contacts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own contacts"
  ON integration_contacts FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own contacts"
  ON integration_contacts FOR DELETE
  USING (user_id = auth.uid());

-- Drop existing policies for integration_usage_logs
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view their own usage logs" ON integration_usage_logs;
END $$;

-- integration_usage_logs policies (read-only for users)
CREATE POLICY "Users can view their own usage logs"
  ON integration_usage_logs FOR SELECT
  USING (user_id = auth.uid());

-- ============================================
-- STEP 6: Helper Functions
-- ============================================

-- Function to increment integration usage counters
CREATE OR REPLACE FUNCTION increment_integration_usage(
  p_integration_id UUID,
  p_success_count INTEGER,
  p_failure_count INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE user_integrations
  SET
    total_sent = total_sent + p_success_count,
    total_failed = total_failed + p_failure_count,
    last_used_at = NOW(),
    updated_at = NOW()
  WHERE id = p_integration_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's primary integration by service type
CREATE OR REPLACE FUNCTION get_primary_integration(
  p_user_id UUID,
  p_service_type TEXT
)
RETURNS UUID AS $$
DECLARE
  v_integration_id UUID;
BEGIN
  SELECT id INTO v_integration_id
  FROM user_integrations
  WHERE user_id = p_user_id
    AND service_type = p_service_type
    AND is_primary = true
    AND is_active = true
    AND status = 'verified'
  LIMIT 1;

  RETURN v_integration_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate total usage cost for a user
CREATE OR REPLACE FUNCTION calculate_user_integration_cost(
  p_user_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS DECIMAL AS $$
DECLARE
  v_total_cost DECIMAL;
BEGIN
  SELECT COALESCE(SUM(estimated_cost_usd), 0)
  INTO v_total_cost
  FROM integration_usage_logs
  WHERE user_id = p_user_id
    AND created_at BETWEEN p_start_date AND p_end_date;

  RETURN v_total_cost;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 7: Views for Analytics
-- ============================================

-- View: Integration usage summary by user
CREATE OR REPLACE VIEW integration_usage_summary AS
SELECT
  ui.user_id,
  ui.service_type,
  ui.service_name,
  ui.status,
  ui.total_sent,
  ui.total_failed,
  ui.last_used_at,
  COUNT(DISTINCT ic.id) as contact_count,
  COALESCE(SUM(iul.estimated_cost_usd), 0) as total_cost_mtd
FROM user_integrations ui
LEFT JOIN integration_contacts ic ON ui.id = ic.integration_id
LEFT JOIN integration_usage_logs iul ON ui.id = iul.integration_id
  AND iul.created_at >= DATE_TRUNC('month', NOW())
GROUP BY ui.user_id, ui.service_type, ui.service_name, ui.status,
         ui.total_sent, ui.total_failed, ui.last_used_at;

-- ============================================
-- STEP 8: Grant Permissions
-- ============================================

GRANT EXECUTE ON FUNCTION increment_integration_usage(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_primary_integration(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_user_integration_cost(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT SELECT ON integration_usage_summary TO authenticated;

-- ============================================
-- STEP 9: Add integration reference to events
-- ============================================

-- Add optional integration preference to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS preferred_integration_id UUID REFERENCES user_integrations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_events_preferred_integration ON events(preferred_integration_id) WHERE preferred_integration_id IS NOT NULL;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

COMMENT ON TABLE user_integrations IS 'Stores user email/SMS service integrations (Mailchimp, Twilio, etc.) with encrypted credentials';
COMMENT ON TABLE integration_contacts IS 'Imported contacts from external services for each integration';
COMMENT ON TABLE integration_usage_logs IS 'Tracks usage for billing transparency - shows estimated costs per operation';
COMMENT ON FUNCTION increment_integration_usage IS 'Updates integration usage counters after sending notifications';
COMMENT ON FUNCTION get_primary_integration IS 'Returns users primary integration for a given service type';
COMMENT ON FUNCTION calculate_user_integration_cost IS 'Calculates estimated costs for a user over a date range';
