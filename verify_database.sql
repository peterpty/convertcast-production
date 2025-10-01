-- ConvertCast Database Verification Script
-- Execute this after running supabase_setup.sql to verify everything was created correctly

-- Check all tables exist
SELECT
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN (
        'users', 'viewer_profiles', 'events', 'registrations',
        'streams', 'chat_messages', 'ai_analysis',
        'engagemax_interactions', 'autooffer_experiments',
        'insightengine_analytics'
    )
ORDER BY tablename;

-- Check table structure and constraints
SELECT
    t.table_name,
    t.column_name,
    t.data_type,
    t.is_nullable,
    t.column_default,
    CASE WHEN tc.constraint_type = 'PRIMARY KEY' THEN 'PK'
         WHEN tc.constraint_type = 'FOREIGN KEY' THEN 'FK'
         WHEN tc.constraint_type = 'UNIQUE' THEN 'UQ'
         WHEN tc.constraint_type = 'CHECK' THEN 'CK'
         ELSE NULL END as constraint_type
FROM information_schema.columns t
LEFT JOIN information_schema.key_column_usage kcu
    ON t.table_name = kcu.table_name
    AND t.column_name = kcu.column_name
LEFT JOIN information_schema.table_constraints tc
    ON kcu.constraint_name = tc.constraint_name
WHERE t.table_schema = 'public'
    AND t.table_name IN (
        'users', 'viewer_profiles', 'events', 'registrations',
        'streams', 'chat_messages', 'ai_analysis',
        'engagemax_interactions', 'autooffer_experiments',
        'insightengine_analytics'
    )
ORDER BY t.table_name, t.ordinal_position;

-- Check foreign key relationships
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- Check indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN (
        'users', 'viewer_profiles', 'events', 'registrations',
        'streams', 'chat_messages', 'ai_analysis',
        'engagemax_interactions', 'autooffer_experiments',
        'insightengine_analytics'
    )
ORDER BY tablename, indexname;

-- Check triggers
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
    AND event_object_table IN (
        'users', 'viewer_profiles', 'events', 'registrations',
        'streams', 'chat_messages', 'ai_analysis',
        'engagemax_interactions', 'autooffer_experiments',
        'insightengine_analytics'
    )
ORDER BY event_object_table, trigger_name;

-- Check RLS policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Summary count
SELECT 'Tables' as object_type, COUNT(*) as count
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN (
        'users', 'viewer_profiles', 'events', 'registrations',
        'streams', 'chat_messages', 'ai_analysis',
        'engagemax_interactions', 'autooffer_experiments',
        'insightengine_analytics'
    )
UNION ALL
SELECT 'Indexes' as object_type, COUNT(*) as count
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN (
        'users', 'viewer_profiles', 'events', 'registrations',
        'streams', 'chat_messages', 'ai_analysis',
        'engagemax_interactions', 'autooffer_experiments',
        'insightengine_analytics'
    )
    AND indexname NOT LIKE '%_pkey'  -- Exclude primary key indexes
UNION ALL
SELECT 'Triggers' as object_type, COUNT(*) as count
FROM information_schema.triggers
WHERE event_object_schema = 'public'
    AND event_object_table IN (
        'users', 'viewer_profiles', 'events', 'registrations',
        'streams', 'chat_messages', 'ai_analysis',
        'engagemax_interactions', 'autooffer_experiments',
        'insightengine_analytics'
    )
UNION ALL
SELECT 'RLS Policies' as object_type, COUNT(*) as count
FROM pg_policies
WHERE schemaname = 'public';