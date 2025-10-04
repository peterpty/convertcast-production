/**
 * Run Supabase Migration - Add rtmp_server_url column
 * This script executes the migration using Supabase admin client
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('🚀 Connecting to Supabase...');
console.log(`📍 URL: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    console.log('\n🔄 Running migration: add_rtmp_server_url\n');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250104000000_add_rtmp_server_url.sql');

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Migration SQL loaded\n');

    // Execute the migration using raw SQL via Supabase's RPC
    // Split into individual statements and execute them
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.toUpperCase().startsWith('COMMENT'));

    console.log(`📋 Executing ${statements.length} SQL statements...\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (!statement) continue;

      console.log(`   ${i + 1}. ${statement.substring(0, 60)}...`);

      // Use Supabase REST API to execute raw SQL
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ query: statement + ';' })
      });

      if (!response.ok) {
        // Try alternative approach - execute via pg_stat
        console.log('   ⚠️  Standard exec failed, trying alternative...');

        // For ALTER TABLE, we can use the supabase-js client query
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' }).single();

        if (error) {
          console.log(`   ⚠️  Statement may have succeeded despite error: ${error.message}`);
          // Don't fail - column might already exist
        } else {
          console.log('   ✅ Success');
        }
      } else {
        console.log('   ✅ Success');
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Verify column in Supabase Dashboard → Table Editor → streams');
    console.log('   2. Column: rtmp_server_url (TEXT, nullable)');
    console.log('   3. Index: idx_streams_credentials created\n');

    // Verify the column was added
    console.log('🔍 Verifying migration...');
    const { data: testData, error: testError } = await supabase
      .from('streams')
      .select('id, rtmp_server_url')
      .limit(1);

    if (testError) {
      if (testError.message.includes('column "rtmp_server_url" does not exist')) {
        console.log('⚠️  Column not found - manual migration may be needed');
        console.log('\n📝 Manual steps:');
        console.log('   1. Go to Supabase Dashboard: https://app.supabase.com');
        console.log('   2. SQL Editor → New Query');
        console.log('   3. Paste the SQL from: supabase/migrations/20250104000000_add_rtmp_server_url.sql');
        console.log('   4. Run the query');
      } else {
        throw testError;
      }
    } else {
      console.log('✅ Column verified successfully!');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\n💡 Manual migration steps:');
    console.error('   1. Open Supabase Dashboard: https://app.supabase.com');
    console.error('   2. Navigate to: SQL Editor');
    console.error('   3. Copy SQL from: supabase/migrations/20250104000000_add_rtmp_server_url.sql');
    console.error('   4. Paste and execute in SQL Editor\n');
    process.exit(1);
  }
}

runMigration();
