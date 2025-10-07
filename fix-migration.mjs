const SUPABASE_ACCESS_TOKEN = 'sbp_f9b5204ff17598dacda1b13cc2c046e4b290f2e7';
const PROJECT_REF = 'yedvdwedhoetxukablxf';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function executeSQL(sql) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(`API Error ${response.status}: ${responseText}`);
  }

  try {
    return JSON.parse(responseText);
  } catch (e) {
    return [];
  }
}

async function main() {
  console.log('🔧 Fixing database schema conflicts...\n');

  // Drop conflicting tables from old PDF schema (INTEGER-based)
  console.log('🗑️  Dropping conflicting tables with INTEGER ids...\n');

  const tablesToDrop = [
    'viewer_sessions',      // Has INTEGER viewer_id, need UUID viewer_profile_id
    'viewer_purchase_history',  // Has INTEGER viewer_id
    'viewers',              // Redundant with viewer_profiles
    'event_sessions',       // If exists, redundant with viewer_sessions
    'event_questions',      // From PDF, not in our schema
    'event_reminders',      // Redundant with event_notifications
    'event_registrations',  // Redundant with registrations
    'stream_overlays',      // From PDF, conflicts with overlay_configs
    'chat_audit_log'        // From PDF, not in our schema
  ];

  for (const table of tablesToDrop) {
    try {
      console.log(`  Dropping ${table}...`);
      await executeSQL(`DROP TABLE IF EXISTS ${table} CASCADE;`);
      console.log(`  ✅ Dropped ${table}`);
    } catch (error) {
      console.log(`  ⚠️ Could not drop ${table}:`, error.message);
    }
  }

  console.log('\n⏳ Waiting for drops to finalize...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Now run the new migration
  console.log('📦 Running new migration with UUID architecture...\n');

  const migrationSQL = readFileSync(
    join(__dirname, 'supabase', 'migrations', '20250105000004_add_missing_critical_tables.sql'),
    'utf-8'
  );

  try {
    await executeSQL(migrationSQL);
    console.log('✅ Migration completed successfully!\n');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }

  // Verify final state
  console.log('🔍 Verifying final database state...\n');

  const tables = await executeSQL(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `);

  console.log(`📊 Database now has ${tables.length} tables\n`);

  // Check for our new tables
  const newTables = [
    'admin_settings',
    'obs_connections',
    'obs_scenes',
    'obs_sources',
    'overlay_templates',
    'overlay_configs',
    'overlay_events',
    'overlay_analytics',
    'viewer_sessions'
  ];

  console.log('📋 Checking new tables:\n');
  for (const table of newTables) {
    const exists = tables.some(t => t.tablename === table);
    console.log(`  ${exists ? '✅' : '❌'} ${table}`);
  }

  // Check viewer_sessions structure
  console.log('\n🔍 Verifying viewer_sessions structure...\n');

  const columns = await executeSQL(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'viewer_sessions'
    AND table_schema = 'public'
    ORDER BY ordinal_position;
  `);

  if (columns.length > 0) {
    console.log('viewer_sessions columns:');
    columns.forEach(c => {
      const isCorrect = (c.column_name === 'id' && c.data_type === 'uuid') ||
                        (c.column_name === 'viewer_profile_id' && c.data_type === 'uuid') ||
                        (c.column_name === 'stream_id' && c.data_type === 'uuid');

      console.log(`  ${isCorrect ? '✅' : '⚠️'}  ${c.column_name} (${c.data_type})`);
    });
  }

  console.log('\n🎉 Migration fix complete!\n');
}

main().catch(console.error);
