-- ConvertCast Database Setup Script
-- Execute this in your Supabase SQL editor or via CLI

-- Step 1: Drop all existing tables (in reverse dependency order)
DROP TABLE IF EXISTS insightengine_analytics CASCADE;
DROP TABLE IF EXISTS autooffer_experiments CASCADE;
DROP TABLE IF EXISTS engagemax_interactions CASCADE;
DROP TABLE IF EXISTS ai_analysis CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS streams CASCADE;
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS viewer_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Step 2: Create tables

-- Users table (Streamers only)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    company TEXT,
    timezone TEXT DEFAULT 'America/New_York',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Viewer profiles (No auth required)
CREATE TABLE viewer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    company TEXT,
    timezone TEXT,
    device_info JSONB DEFAULT '{}',
    behavioral_data JSONB DEFAULT '{}',
    purchase_history JSONB DEFAULT '[]',
    engagement_metrics JSONB DEFAULT '{}',
    intent_score INTEGER DEFAULT 0 CHECK (intent_score >= 0 AND intent_score <= 100),
    lifetime_value DECIMAL(10,2) DEFAULT 0,
    ai_insights JSONB DEFAULT '{}',
    showup_surge_data JSONB DEFAULT '{}',
    engagemax_data JSONB DEFAULT '{}',
    autooffer_data JSONB DEFAULT '{}',
    total_events_attended INTEGER DEFAULT 0,
    total_purchases INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    first_seen_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    timezone TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'live', 'completed')),
    max_attendees INTEGER,
    registration_required BOOLEAN DEFAULT true,
    custom_fields JSONB DEFAULT '{}',
    smartscheduler_data JSONB DEFAULT '{}',
    predicted_attendance INTEGER,
    predicted_revenue DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Registrations table
CREATE TABLE registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    viewer_profile_id UUID NOT NULL REFERENCES viewer_profiles(id) ON DELETE CASCADE,
    access_token TEXT UNIQUE NOT NULL,
    registration_data JSONB DEFAULT '{}',
    source TEXT CHECK (source IN ('email', 'sms', 'social')),
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    attended BOOLEAN DEFAULT false,
    attendance_duration INTEGER DEFAULT 0,
    showup_surge_sequence JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, viewer_profile_id)
);

-- Streams table
CREATE TABLE streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    mux_stream_id TEXT,
    mux_playback_id TEXT,
    stream_key TEXT,
    status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'active', 'ended')),
    peak_viewers INTEGER DEFAULT 0,
    total_viewers INTEGER DEFAULT 0,
    engagemax_config JSONB DEFAULT '{}',
    autooffer_config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id UUID NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
    viewer_profile_id UUID NOT NULL REFERENCES viewer_profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'removed', 'deleted', 'pinned', 'synthetic')),
    is_synthetic BOOLEAN DEFAULT false,
    intent_signals JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI analysis table
CREATE TABLE ai_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    viewer_profile_id UUID NOT NULL REFERENCES viewer_profiles(id) ON DELETE CASCADE,
    stream_id UUID NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
    intent_score INTEGER DEFAULT 0 CHECK (intent_score >= 0 AND intent_score <= 100),
    buying_signals TEXT[] DEFAULT ARRAY[]::TEXT[],
    objections TEXT[] DEFAULT ARRAY[]::TEXT[],
    recommended_action TEXT,
    suggested_message TEXT,
    autooffer_trigger JSONB DEFAULT '{}',
    insightengine_predictions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- EngageMax interactions table
CREATE TABLE engagemax_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id UUID NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
    viewer_profile_id UUID NOT NULL REFERENCES viewer_profiles(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('poll', 'quiz', 'reaction', 'cta')),
    interaction_data JSONB DEFAULT '{}',
    response JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AutoOffer experiments table
CREATE TABLE autooffer_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id UUID NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
    variant_a JSONB DEFAULT '{}',
    variant_b JSONB DEFAULT '{}',
    winner TEXT,
    conversion_rate_a DECIMAL(5,4) DEFAULT 0,
    conversion_rate_b DECIMAL(5,4) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- InsightEngine analytics table
CREATE TABLE insightengine_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    predictions JSONB DEFAULT '{}',
    actual_results JSONB DEFAULT '{}',
    accuracy_score DECIMAL(5,4) DEFAULT 0,
    recommendations JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create indexes for performance
CREATE INDEX idx_viewer_profiles_email ON viewer_profiles(email);
CREATE INDEX idx_registrations_event_id ON registrations(event_id);
CREATE INDEX idx_registrations_viewer_profile_id ON registrations(viewer_profile_id);
CREATE INDEX idx_registrations_event_viewer ON registrations(event_id, viewer_profile_id);
CREATE INDEX idx_chat_messages_stream_id ON chat_messages(stream_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_chat_messages_stream_created ON chat_messages(stream_id, created_at);
CREATE INDEX idx_ai_analysis_intent_score ON ai_analysis(intent_score DESC);
CREATE INDEX idx_ai_analysis_viewer_profile ON ai_analysis(viewer_profile_id);
CREATE INDEX idx_ai_analysis_stream_id ON ai_analysis(stream_id);
CREATE INDEX idx_engagemax_interactions_stream_id ON engagemax_interactions(stream_id);
CREATE INDEX idx_engagemax_interactions_type ON engagemax_interactions(interaction_type);
CREATE INDEX idx_engagemax_interactions_stream_type ON engagemax_interactions(stream_id, interaction_type);
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_scheduled_start ON events(scheduled_start);
CREATE INDEX idx_streams_event_id ON streams(event_id);
CREATE INDEX idx_streams_status ON streams(status);
CREATE INDEX idx_viewer_profiles_intent_score ON viewer_profiles(intent_score DESC);
CREATE INDEX idx_viewer_profiles_lifetime_value ON viewer_profiles(lifetime_value DESC);

-- Step 4: Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 5: Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_viewer_profiles_updated_at
    BEFORE UPDATE ON viewer_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registrations_updated_at
    BEFORE UPDATE ON registrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_streams_updated_at
    BEFORE UPDATE ON streams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_analysis_updated_at
    BEFORE UPDATE ON ai_analysis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_autooffer_experiments_updated_at
    BEFORE UPDATE ON autooffer_experiments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 6: Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE viewer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagemax_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE autooffer_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE insightengine_analytics ENABLE ROW LEVEL SECURITY;

-- Step 7: Create basic RLS policies (you may need to customize these based on your auth requirements)

-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users FOR ALL USING (auth.uid() = id);

-- Viewer profiles are accessible by all authenticated users (for streamers to see their viewers)
CREATE POLICY "Viewer profiles viewable by authenticated users" ON viewer_profiles FOR ALL USING (true);

-- Events are owned by the creating user
CREATE POLICY "Users can manage own events" ON events FOR ALL USING (auth.uid() = user_id);

-- Other tables inherit permissions based on related events/streams
CREATE POLICY "Registrations viewable via events" ON registrations FOR ALL USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = registrations.event_id AND events.user_id = auth.uid())
);

CREATE POLICY "Streams viewable via events" ON streams FOR ALL USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = streams.event_id AND events.user_id = auth.uid())
);

CREATE POLICY "Chat messages viewable via streams" ON chat_messages FOR ALL USING (
    EXISTS (
        SELECT 1 FROM streams
        JOIN events ON events.id = streams.event_id
        WHERE streams.id = chat_messages.stream_id AND events.user_id = auth.uid()
    )
);

CREATE POLICY "AI analysis viewable via streams" ON ai_analysis FOR ALL USING (
    EXISTS (
        SELECT 1 FROM streams
        JOIN events ON events.id = streams.event_id
        WHERE streams.id = ai_analysis.stream_id AND events.user_id = auth.uid()
    )
);

CREATE POLICY "EngageMax interactions viewable via streams" ON engagemax_interactions FOR ALL USING (
    EXISTS (
        SELECT 1 FROM streams
        JOIN events ON events.id = streams.event_id
        WHERE streams.id = engagemax_interactions.stream_id AND events.user_id = auth.uid()
    )
);

CREATE POLICY "AutoOffer experiments viewable via streams" ON autooffer_experiments FOR ALL USING (
    EXISTS (
        SELECT 1 FROM streams
        JOIN events ON events.id = streams.event_id
        WHERE streams.id = autooffer_experiments.stream_id AND events.user_id = auth.uid()
    )
);

CREATE POLICY "InsightEngine analytics viewable via events" ON insightengine_analytics FOR ALL USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = insightengine_analytics.event_id AND events.user_id = auth.uid())
);

-- Grant necessary permissions to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Commit the changes
COMMIT;