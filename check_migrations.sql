-- Check if migrations tracking table exists and what's been run
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'schema_migrations'
    )
    THEN 'Migrations table exists'
    ELSE 'No migrations table - fresh database'
  END as migration_status;

-- If migrations table exists, show what's been run
SELECT * FROM schema_migrations
ORDER BY version DESC
LIMIT 20;
