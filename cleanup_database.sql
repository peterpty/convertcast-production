-- ConvertCast Database Cleanup Script
-- Use this to completely remove all ConvertCast tables and related objects

-- Step 1: Drop all RLS policies
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Viewer profiles viewable by authenticated users" ON viewer_profiles;
DROP POLICY IF EXISTS "Users can manage own events" ON events;
DROP POLICY IF EXISTS "Registrations viewable via events" ON registrations;
DROP POLICY IF EXISTS "Streams viewable via events" ON streams;
DROP POLICY IF EXISTS "Chat messages viewable via streams" ON chat_messages;
DROP POLICY IF EXISTS "AI analysis viewable via streams" ON ai_analysis;
DROP POLICY IF EXISTS "EngageMax interactions viewable via streams" ON engagemax_interactions;
DROP POLICY IF EXISTS "AutoOffer experiments viewable via streams" ON autooffer_experiments;
DROP POLICY IF EXISTS "InsightEngine analytics viewable via events" ON insightengine_analytics;

-- Step 2: Drop all triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_viewer_profiles_updated_at ON viewer_profiles;
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
DROP TRIGGER IF EXISTS update_registrations_updated_at ON registrations;
DROP TRIGGER IF EXISTS update_streams_updated_at ON streams;
DROP TRIGGER IF EXISTS update_ai_analysis_updated_at ON ai_analysis;
DROP TRIGGER IF EXISTS update_autooffer_experiments_updated_at ON autooffer_experiments;

-- Step 3: Drop the trigger function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Step 4: Drop all indexes (custom indexes, primary keys and unique constraints will be dropped with tables)
DROP INDEX IF EXISTS idx_viewer_profiles_email;
DROP INDEX IF EXISTS idx_registrations_event_id;
DROP INDEX IF EXISTS idx_registrations_viewer_profile_id;
DROP INDEX IF EXISTS idx_registrations_event_viewer;
DROP INDEX IF EXISTS idx_chat_messages_stream_id;
DROP INDEX IF EXISTS idx_chat_messages_created_at;
DROP INDEX IF EXISTS idx_chat_messages_stream_created;
DROP INDEX IF EXISTS idx_ai_analysis_intent_score;
DROP INDEX IF EXISTS idx_ai_analysis_viewer_profile;
DROP INDEX IF EXISTS idx_ai_analysis_stream_id;
DROP INDEX IF EXISTS idx_engagemax_interactions_stream_id;
DROP INDEX IF EXISTS idx_engagemax_interactions_type;
DROP INDEX IF EXISTS idx_engagemax_interactions_stream_type;
DROP INDEX IF EXISTS idx_events_user_id;
DROP INDEX IF EXISTS idx_events_status;
DROP INDEX IF EXISTS idx_events_scheduled_start;
DROP INDEX IF EXISTS idx_streams_event_id;
DROP INDEX IF EXISTS idx_streams_status;
DROP INDEX IF EXISTS idx_viewer_profiles_intent_score;
DROP INDEX IF EXISTS idx_viewer_profiles_lifetime_value;

-- Step 5: Drop all tables (in reverse dependency order to handle foreign key constraints)
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

-- Verify cleanup
SELECT 'Cleanup complete. Tables remaining:' as status;

SELECT
    schemaname,
    tablename
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN (
        'users', 'viewer_profiles', 'events', 'registrations',
        'streams', 'chat_messages', 'ai_analysis',
        'engagemax_interactions', 'autooffer_experiments',
        'insightengine_analytics'
    )
ORDER BY tablename;