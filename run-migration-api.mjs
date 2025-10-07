import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_ACCESS_TOKEN = 'sbp_f9b5204ff17598dacda1b13cc2c046e4b290f2e7';
const PROJECT_REF = 'yedvdwedhoetxukablxf';

async function executeSQL(sql) {
  console.log('📡 Sending SQL to Supabase API...');

  const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });

  console.log(`📊 API Response Status: ${response.status} ${response.statusText}`);

  const responseText = await response.text();
  console.log('📄 API Response:', responseText.substring(0, 500));

  if (!response.ok) {
    throw new Error(`API Error ${response.status}: ${responseText}`);
  }

  try {
    return JSON.parse(responseText);
  } catch (e) {
    console.log('⚠️ Response is not JSON');
    return { result: [] };
  }
}

async function checkTables() {
  console.log('🔍 Checking existing tables...\n');

  try {
    const result = await executeSQL(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    // The API returns an array directly, not wrapped in a result property
    const tables = Array.isArray(result) ? result.map(r => r.tablename) : [];
    console.log(`Found ${tables.length} tables:`, tables.slice(0, 10).join(', '), tables.length > 10 ? `... (${tables.length} total)` : '');
    return tables;
  } catch (error) {
    console.log('⚠️ Error checking tables:', error.message);
    return [];
  }
}

async function runSQL(sqlContent, label) {
  console.log(`\n📝 Running ${label}...`);

  try {
    await executeSQL(sqlContent);
    console.log(`✅ ${label} completed successfully!`);
    return true;
  } catch (error) {
    console.error(`❌ ${label} failed:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting database migration via Supabase API...\n');

  try {
    // Check current tables
    const existingTables = await checkTables();

    // Check if base tables exist
    const baseTablesExist = existingTables.includes('users') &&
                            existingTables.includes('viewer_profiles') &&
                            existingTables.includes('events');

    if (!baseTablesExist) {
      console.log('\n⚠️ Base tables missing. Running base schema first...\n');
      const baseSQL = readFileSync(join(__dirname, 'supabase_setup.sql'), 'utf-8');
      const success = await runSQL(baseSQL, 'Base Schema (15 tables)');

      if (!success) {
        console.error('\n❌ Failed to run base schema. Aborting.');
        process.exit(1);
      }

      // Wait longer for tables to be fully created and indexes built
      console.log('⏳ Waiting for base schema to finalize...\n');
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Verify base tables were created
      console.log('🔍 Verifying base tables were created...\n');
      const verifyTables = await checkTables();

      if (!verifyTables.includes('viewer_profiles')) {
        console.error('❌ ERROR: viewer_profiles table was not created! Aborting.');
        console.log('Tables that were created:', verifyTables.join(', '));
        process.exit(1);
      }

      console.log('✅ Base tables verified successfully!\n');
    } else {
      console.log('\n✅ Base tables already exist. Skipping base schema.\n');
    }

    // Run new migration
    console.log('\n📦 Running new migration (9 additional tables)...\n');
    const migrationSQL = readFileSync(
      join(__dirname, 'supabase', 'migrations', '20250105000004_add_missing_critical_tables.sql'),
      'utf-8'
    );
    const success = await runSQL(migrationSQL, 'New Migration (9 tables)');

    if (!success) {
      console.error('\n❌ Migration failed. Check error messages above.');
      process.exit(1);
    }

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Verify final state
    console.log('\n🔍 Verifying final database state...\n');
    const finalTables = await checkTables();

    console.log(`\n✅ Migration complete! Database now has ${finalTables.length} tables.`);
    console.log('📊 Expected: 24 tables (15 base + 9 new)');
    console.log(`📊 Actual: ${finalTables.length} tables\n`);

    if (finalTables.length >= 24) {
      console.log('🎉 SUCCESS! All tables created successfully!\n');
      console.log('📋 New tables added:');
      console.log('   - admin_settings');
      console.log('   - obs_connections, obs_scenes, obs_sources');
      console.log('   - overlay_templates, overlay_configs, overlay_events, overlay_analytics');
      console.log('   - viewer_sessions\n');
    } else {
      console.log('⚠️ Warning: Table count doesn\'t match expected. Review logs above.\n');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main().catch(console.error);
