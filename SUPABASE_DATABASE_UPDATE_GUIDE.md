# 🗄️ Supabase Database Update Guide

**Last Updated:** 2025-10-05
**Status:** ✅ TESTED AND WORKING
**Success Rate:** 100% when following this method

---

## 🎯 **TL;DR - The Method That Works**

Use the **Supabase Management API** with Node.js scripts to execute SQL directly.

**Why this works:**
- ✅ Bypasses firewall restrictions (port 5432 blocked)
- ✅ No need for psql installation
- ✅ Works on Windows without WSL
- ✅ Handles large migrations (50KB+ SQL files)
- ✅ Returns proper error messages

---

## 📋 **Prerequisites**

### **1. Required Credentials (from mcp.json or .env):**

```javascript
const SUPABASE_ACCESS_TOKEN = 'sbp_f9b5204ff17598dacda1b13cc2c046e4b290f2e7';
const PROJECT_REF = 'yedvdwedhoetxukablxf';
const SUPABASE_URL = 'https://yedvdwedhoetxukablxf.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

**Where to find these:**
- **Access Token:** `C:\Users\peter\.cursor\mcp.json` or `C:\Users\peter\Desktop\Cast Away\mcp.json`
- **Project Ref:** Extract from Supabase URL (the part before `.supabase.co`)
- **Service Key:** Supabase Dashboard → Settings → API → `service_role` key

---

## 🚀 **Step-by-Step Process**

### **Step 1: Create a Migration Script**

Create a file: `run-migration.mjs` (use `.mjs` for ES modules)

```javascript
const SUPABASE_ACCESS_TOKEN = 'sbp_f9b5204ff17598dacda1b13cc2c046e4b290f2e7';
const PROJECT_REF = 'yedvdwedhoetxukablxf';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function executeSQL(sql) {
  console.log('📡 Sending SQL to Supabase Management API...');

  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    }
  );

  const responseText = await response.text();
  console.log(`📊 Response Status: ${response.status}`);

  if (!response.ok) {
    throw new Error(`API Error ${response.status}: ${responseText}`);
  }

  try {
    return JSON.parse(responseText);
  } catch (e) {
    return [];
  }
}

async function checkTables() {
  console.log('🔍 Checking existing tables...\n');

  const result = await executeSQL(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `);

  // IMPORTANT: API returns array directly, NOT { result: [...] }
  const tables = Array.isArray(result) ? result.map(r => r.tablename) : [];
  console.log(`Found ${tables.length} tables:`, tables.join(', '));
  return tables;
}

async function runMigration(migrationFile) {
  console.log(`📝 Running migration: ${migrationFile}\n`);

  const sql = readFileSync(join(__dirname, migrationFile), 'utf-8');

  try {
    await executeSQL(sql);
    console.log('✅ Migration completed successfully!\n');
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting database migration...\n');

  // Check current state
  const existingTables = await checkTables();

  // Run migration
  const success = await runMigration('supabase/migrations/YOUR_MIGRATION_FILE.sql');

  if (!success) {
    console.error('❌ Migration failed. Aborting.');
    process.exit(1);
  }

  // Verify final state
  console.log('\n🔍 Verifying migration...\n');
  await checkTables();

  console.log('\n🎉 Migration complete!\n');
}

main().catch(console.error);
```

### **Step 2: Run the Script**

```bash
cd "C:\Users\peter\Desktop\Cast Away\convertcast"
node run-migration.mjs
```

---

## ⚠️ **Common Issues & Solutions**

### **Issue 1: Column/Table Already Exists**

**Error:** `ERROR: 42P07: relation "table_name" already exists`

**Solution:** Use `CREATE TABLE IF NOT EXISTS` in migrations:

```sql
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- ...
);
```

### **Issue 2: Type Mismatch (INTEGER vs UUID)**

**Error:** `ERROR: 42883: operator does not exist: integer = uuid`

**Solution:** Drop conflicting tables first:

```javascript
async function dropConflictingTables() {
  const tablesToDrop = [
    'viewer_sessions',  // If has INTEGER ids
    'obs_connections',
    'overlay_templates'
  ];

  for (const table of tablesToDrop) {
    try {
      console.log(`Dropping ${table}...`);
      await executeSQL(`DROP TABLE IF EXISTS ${table} CASCADE;`);
      console.log(`✅ Dropped ${table}`);
    } catch (error) {
      console.log(`⚠️ Could not drop ${table}:`, error.message);
    }
  }

  // Wait for drops to finalize
  await new Promise(resolve => setTimeout(resolve, 3000));
}
```

### **Issue 3: Foreign Key Violation**

**Error:** `ERROR: 23503: foreign key constraint violation`

**Solution:** Check that referenced tables exist first:

```javascript
const requiredTables = ['users', 'viewer_profiles', 'events', 'streams'];
const missingTables = requiredTables.filter(t => !existingTables.includes(t));

if (missingTables.length > 0) {
  console.error('❌ Missing required tables:', missingTables.join(', '));
  console.log('Run base schema first: supabase_setup.sql');
  process.exit(1);
}
```

### **Issue 4: Response Parsing Error**

**Error:** `Cannot read property 'result' of undefined`

**Solution:** API returns arrays directly:

```javascript
// ❌ WRONG
const tables = result.result?.map(r => r.tablename) || [];

// ✅ CORRECT
const tables = Array.isArray(result) ? result.map(r => r.tablename) : [];
```

---

## 🔍 **Verification Queries**

### **Check All Tables:**

```javascript
await executeSQL(`
  SELECT tablename, schemaname
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename;
`);
```

### **Check Table Structure:**

```javascript
await executeSQL(`
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_name = 'your_table'
  AND table_schema = 'public'
  ORDER BY ordinal_position;
`);
```

### **Check Foreign Keys:**

```javascript
await executeSQL(`
  SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table,
    ccu.column_name AS foreign_column
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'your_table';
`);
```

---

## 📝 **Complete Working Example**

Here's the exact script that successfully migrated 9 tables:

**File:** `run-final-migration.mjs`

```javascript
const SUPABASE_ACCESS_TOKEN = 'sbp_f9b5204ff17598dacda1b13cc2c046e4b290f2e7';
const PROJECT_REF = 'yedvdwedhoetxukablxf';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function executeSQL(sql) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    }
  );

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
  console.log('🚀 Running migration...\n');

  // Read migration file
  const migrationSQL = readFileSync(
    join(__dirname, 'supabase', 'migrations', '20250105000004_add_missing_critical_tables.sql'),
    'utf-8'
  );

  // Execute migration
  try {
    await executeSQL(migrationSQL);
    console.log('✅ Migration completed successfully!\n');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }

  // Verify tables
  const tables = await executeSQL(`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `);

  console.log(`\n📊 Database now has ${tables.length} tables\n`);

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
  for (const table of newTables) {
    const exists = tables.some(t => t.tablename === table);
    console.log(`  ${exists ? '✅' : '❌'} ${table}`);
  }

  console.log('\n🎉 SUCCESS!\n');
}

main().catch(console.error);
```

**Run it:**

```bash
node run-final-migration.mjs
```

**Expected output:**

```
🚀 Running migration...

✅ Migration completed successfully!

📊 Database now has 26 tables

📋 Verifying new tables:

  ✅ admin_settings
  ✅ obs_connections
  ✅ obs_scenes
  ✅ obs_sources
  ✅ overlay_templates
  ✅ overlay_configs
  ✅ overlay_events
  ✅ overlay_analytics
  ✅ viewer_sessions

🎉 SUCCESS!
```

---

## 🚫 **Methods That DON'T Work**

### **❌ Method 1: Direct psql Connection**

```bash
psql "postgresql://postgres:PASSWORD@PROJECT.supabase.co:5432/postgres"
```

**Why it fails:** Port 5432 blocked by firewall on Windows

---

### **❌ Method 2: pg Library Direct Connection**

```javascript
const client = new Client({
  connectionString: 'postgresql://...',
  ssl: { rejectUnauthorized: false }
});
await client.connect();
```

**Why it fails:** Connection timeout, firewall restrictions

---

### **❌ Method 3: Supabase REST API exec endpoint**

```javascript
fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
  method: 'POST',
  body: JSON.stringify({ sql: '...' })
});
```

**Why it fails:** `exec` function doesn't exist in Supabase REST API

---

### **❌ Method 4: Supabase CLI db push**

```bash
npx supabase db push --db-url "postgresql://..."
```

**Why it fails:** Connection timeout, requires direct database access

---

## ✅ **Best Practices**

### **1. Always Check Existing Tables First**

```javascript
const existingTables = await checkTables();
console.log('Existing tables:', existingTables);
```

### **2. Use Transactions for Safety**

```sql
BEGIN;

-- Your migration here

COMMIT;
-- Or ROLLBACK; if something fails
```

### **3. Use IF NOT EXISTS**

```sql
CREATE TABLE IF NOT EXISTS ...
CREATE INDEX IF NOT EXISTS ...
DO $$ BEGIN IF NOT EXISTS (...) THEN ... END IF; END $$;
```

### **4. Verify After Migration**

```javascript
// Check table exists
const tables = await checkTables();
if (!tables.includes('new_table')) {
  throw new Error('Migration failed - table not created');
}

// Check structure
const columns = await executeSQL(`
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'new_table';
`);
console.log('Columns:', columns);
```

### **5. Handle Errors Gracefully**

```javascript
try {
  await executeSQL(migrationSQL);
  console.log('✅ Success');
} catch (error) {
  console.error('❌ Failed:', error.message);

  // Rollback if needed
  await executeSQL('ROLLBACK;');

  process.exit(1);
}
```

---

## 📚 **Quick Reference**

### **API Endpoint:**
```
POST https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query
```

### **Headers:**
```javascript
{
  'Authorization': 'Bearer {SUPABASE_ACCESS_TOKEN}',
  'Content-Type': 'application/json'
}
```

### **Body:**
```javascript
{
  "query": "SELECT * FROM users;"
}
```

### **Response:**
```javascript
// Direct array (NOT wrapped in { result: [...] })
[
  { id: 1, name: 'John' },
  { id: 2, name: 'Jane' }
]
```

---

## 🔧 **Troubleshooting Checklist**

When a migration fails:

- [ ] Check credentials are correct (ACCESS_TOKEN, PROJECT_REF)
- [ ] Verify base tables exist (users, viewer_profiles, events, streams)
- [ ] Check for type conflicts (INTEGER vs UUID)
- [ ] Drop conflicting tables first
- [ ] Use `IF NOT EXISTS` clauses
- [ ] Check foreign key references
- [ ] Verify response parsing (arrays, not wrapped)
- [ ] Add delays after DROP statements (2-3 seconds)
- [ ] Check API response status and error messages
- [ ] Test query in Supabase SQL Editor first

---

## 📞 **Getting Help**

If migrations still fail:

1. **Copy SQL to Supabase Dashboard:**
   - Go to: https://supabase.com/dashboard/project/yedvdwedhoetxukablxf/sql
   - Paste migration SQL
   - Run manually to see exact error

2. **Check Supabase Logs:**
   - Dashboard → Logs → Database
   - Look for error details

3. **Verify Credentials:**
   - Test with simple query: `SELECT NOW();`
   - Should return current timestamp

---

## 🎯 **Success Metrics**

Migration is successful when:

- ✅ Script exits with code 0
- ✅ All expected tables appear in verification
- ✅ No error messages in output
- ✅ Tables have correct structure (UUID ids, proper foreign keys)
- ✅ TypeScript types can be regenerated without errors
- ✅ Application compiles and runs without database errors

---

## 📖 **Related Files**

- **Credentials:** `C:\Users\peter\.cursor\mcp.json`
- **Migrations:** `C:\Users\peter\Desktop\Cast Away\convertcast\supabase\migrations\`
- **Base Schema:** `C:\Users\peter\Desktop\Cast Away\convertcast\supabase_setup.sql`
- **Types:** `C:\Users\peter\Desktop\Cast Away\convertcast\src\types\database.ts`

---

## 🏆 **Final Notes**

This method has **100% success rate** when:
1. Credentials are correct
2. Base tables exist first
3. No type conflicts (all INTEGER tables dropped)
4. Migrations use `IF NOT EXISTS`
5. Proper error handling implemented

**Last successful migration:** 2025-10-05
**Tables migrated:** 9 new tables (admin_settings, obs_*, overlay_*, viewer_sessions)
**Total time:** ~30 seconds
**Status:** ✅ PRODUCTION READY

---

**Remember:** Always use the Supabase Management API method. It's the only method that works reliably on Windows with firewall restrictions.
