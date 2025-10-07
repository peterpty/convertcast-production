import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try direct connection first
const connectionString = 'postgresql://postgres:6sWoecfvgYgbC0yu@db.yedvdwedhoetxukablxf.supabase.co:5432/postgres';

async function checkTables(client) {
  console.log('🔍 Checking existing tables...\n');

  try {
    const result = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    const tables = result.rows.map(r => r.tablename);
    console.log(`Found ${tables.length} tables:`, tables.join(', ') || '(none)');
    return tables;
  } catch (error) {
    console.log('⚠️ Error checking tables:', error.message);
    return [];
  }
}

async function runSQL(client, sqlContent, label) {
  console.log(`\n📝 Running ${label}...`);

  try {
    await client.query(sqlContent);
    console.log(`✅ ${label} completed successfully!`);
    return true;
  } catch (error) {
    console.error(`❌ ${label} failed:`, error.message);
    console.error('Error details:', error.detail || error.hint || 'No additional details');
    return false;
  }
}

async function main() {
  console.log('🚀 Starting database migration...\n');
  console.log('🔗 Connecting to Supabase...\n');

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database!\n');

    // Check current tables
    const existingTables = await checkTables(client);

    // Check if base tables exist
    const baseTablesExist = existingTables.includes('users') &&
                            existingTables.includes('viewer_profiles') &&
                            existingTables.includes('events');

    if (!baseTablesExist) {
      console.log('\n⚠️ Base tables missing. Running base schema first...\n');
      const baseSQL = readFileSync(join(__dirname, 'supabase_setup.sql'), 'utf-8');
      const success = await runSQL(client, baseSQL, 'Base Schema (15 tables)');

      if (!success) {
        console.error('\n❌ Failed to run base schema. Aborting.');
        process.exit(1);
      }

      // Wait a moment for tables to be created
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      console.log('\n✅ Base tables already exist. Skipping base schema.\n');
    }

    // Run new migration
    console.log('\n📦 Running new migration (9 additional tables)...\n');
    const migrationSQL = readFileSync(
      join(__dirname, 'supabase', 'migrations', '20250105000004_add_missing_critical_tables.sql'),
      'utf-8'
    );
    const success = await runSQL(client, migrationSQL, 'New Migration (9 tables)');

    if (!success) {
      console.error('\n❌ Migration failed. Check error messages above.');
      process.exit(1);
    }

    // Wait a moment for tables to be created
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify final state
    console.log('\n🔍 Verifying final database state...\n');
    const finalTables = await checkTables(client);

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
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Disconnected from database.\n');
  }
}

main().catch(console.error);
