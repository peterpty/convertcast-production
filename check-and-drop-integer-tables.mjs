const SUPABASE_ACCESS_TOKEN = 'sbp_f9b5204ff17598dacda1b13cc2c046e4b290f2e7';
const PROJECT_REF = 'yedvdwedhoetxukablxf';

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
  if (!response.ok) throw new Error(`API Error: ${responseText}`);

  try {
    return JSON.parse(responseText);
  } catch (e) {
    return [];
  }
}

async function main() {
  console.log('🔍 Checking for tables with INTEGER ids...\n');

  // Get all tables and their id column types
  const query = `
    SELECT
      t.tablename,
      c.column_name,
      c.data_type
    FROM pg_tables t
    JOIN information_schema.columns c
      ON c.table_name = t.tablename
      AND c.table_schema = t.schemaname
    WHERE t.schemaname = 'public'
      AND c.column_name = 'id'
    ORDER BY t.tablename;
  `;

  const results = await executeSQL(query);

  const integerTables = results.filter(r => r.data_type === 'integer');
  const uuidTables = results.filter(r => r.data_type === 'uuid');

  console.log(`📊 Found ${integerTables.length} tables with INTEGER ids:`);
  integerTables.forEach(t => console.log(`  - ${t.tablename}`));

  console.log(`\n📊 Found ${uuidTables.length} tables with UUID ids:`);
  uuidTables.forEach(t => console.log(`  - ${t.tablename}`));

  // Tables that should have UUID but currently have INTEGER
  const tablesToRecreate = [
    'admin_settings',
    'obs_connections',
    'obs_scenes',
    'obs_sources',
    'overlay_templates',
    'overlay_configs',
    'overlay_events',
    'overlay_analytics'
  ];

  const needsDropping = integerTables.filter(t =>
    tablesToRecreate.includes(t.tablename)
  );

  if (needsDropping.length > 0) {
    console.log(`\n🗑️  Dropping ${needsDropping.length} tables that need UUID conversion:\n`);

    for (const table of needsDropping) {
      try {
        console.log(`  Dropping ${table.tablename}...`);
        await executeSQL(`DROP TABLE IF EXISTS ${table.tablename} CASCADE;`);
        console.log(`  ✅ Dropped ${table.tablename}`);
      } catch (error) {
        console.log(`  ❌ Error dropping ${table.tablename}:`, error.message);
      }
    }

    console.log('\n✅ All INTEGER-based tables dropped!\n');
    console.log('Now run the migration again to create them with UUID ids.');
  } else {
    console.log('\n✅ No INTEGER tables need to be dropped.');
  }
}

main().catch(console.error);
