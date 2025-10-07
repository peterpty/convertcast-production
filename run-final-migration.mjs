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
  console.log('🚀 Running final migration with UUID architecture...\n');

  const migrationSQL = readFileSync(
    join(__dirname, 'supabase', 'migrations', '20250105000004_add_missing_critical_tables.sql'),
    'utf-8'
  );

  try {
    console.log('📝 Executing migration SQL...\n');
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

  console.log('📋 Verifying new tables:\n');
  let allPresent = true;
  for (const table of newTables) {
    const exists = tables.some(t => t.tablename === table);
    console.log(`  ${exists ? '✅' : '❌'} ${table}`);
    if (!exists) allPresent = false;
  }

  if (allPresent) {
    console.log('\n🎉 SUCCESS! All 9 new tables created with UUID architecture!\n');

    // Verify viewer_sessions structure
    console.log('🔍 Verifying viewer_sessions has correct UUID structure...\n');

    const columns = await executeSQL(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'viewer_sessions'
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    if (columns.length > 0) {
      columns.forEach(c => {
        const isCorrect = (c.column_name === 'id' && c.data_type === 'uuid') ||
                          (c.column_name === 'viewer_profile_id' && c.data_type === 'uuid') ||
                          (c.column_name === 'stream_id' && c.data_type === 'uuid');

        console.log(`  ${isCorrect || c.data_type.includes('timestamp') || c.data_type === 'integer' || c.data_type === 'text' || c.data_type === 'jsonb' ? '✅' : '⚠️'}  ${c.column_name} (${c.data_type})`);
      });
    }

    console.log('\n📈 Database migration complete! Ready for next steps.\n');
  } else {
    console.log('\n⚠️ Some tables are missing. Check errors above.\n');
  }
}

main().catch(console.error);
