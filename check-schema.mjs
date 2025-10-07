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

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error ${response.status}: ${error}`);
  }

  return await response.json();
}

async function main() {
  console.log('🔍 Checking database schema...\n');

  // Get all tables
  const tables = await executeSQL(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `);

  console.log(`📊 Found ${tables.length} tables:\n`);
  tables.forEach((t, i) => {
    console.log(`${i + 1}. ${t.tablename}`);
  });

  // Check for viewer-related tables
  console.log('\n🔍 Checking for viewer tables...\n');
  const viewerTables = tables.filter(t =>
    t.tablename.includes('viewer') || t.tablename.includes('users')
  );

  if (viewerTables.length > 0) {
    console.log('Found viewer-related tables:');
    viewerTables.forEach(t => console.log(`  - ${t.tablename}`));

    // Get column details for each viewer table
    for (const table of viewerTables) {
      console.log(`\n📋 Columns in ${table.tablename}:`);
      const columns = await executeSQL(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = '${table.tablename}'
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);

      columns.forEach(c => console.log(`  - ${c.column_name} (${c.data_type})`));
    }
  } else {
    console.log('⚠️ No viewer-related tables found!');
  }
}

main().catch(console.error);
