-- ====================================================================
-- Database Structure Verification Query
-- Run this FIRST to see what tables currently exist
-- ====================================================================

-- Check all existing tables
SELECT
  tablename,
  schemaname
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check if critical base tables exist
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users')
    THEN '✅ users exists'
    ELSE '❌ users MISSING'
  END as users_status,

  CASE
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'viewer_profiles')
    THEN '✅ viewer_profiles exists'
    ELSE '❌ viewer_profiles MISSING'
  END as viewer_profiles_status,

  CASE
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'events')
    THEN '✅ events exists'
    ELSE '❌ events MISSING'
  END as events_status,

  CASE
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'streams')
    THEN '✅ streams exists'
    ELSE '❌ streams MISSING'
  END as streams_status,

  CASE
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'registrations')
    THEN '✅ registrations exists'
    ELSE '❌ registrations MISSING'
  END as registrations_status,

  CASE
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'chat_messages')
    THEN '✅ chat_messages exists'
    ELSE '❌ chat_messages MISSING'
  END as chat_messages_status;
