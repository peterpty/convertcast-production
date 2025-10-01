const https = require('https');

// Supabase configuration
const supabaseUrl = 'yedvdwedhoetxukablxf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllZHZkd2VkaG9ldHh1a2FibHhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzYwMTExOCwiZXhwIjoyMDUzMTc3MTE4fQ.PgI8jBl5vK7PaUpNPVQB8JBa4Gn1gH4GBKFpjsm7iI0';

async function executePostgresQuery(query) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: query });

    const options = {
      hostname: supabaseUrl,
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseBody = '';

      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(responseBody);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(result);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${result.message || responseBody}`));
          }
        } catch (e) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(responseBody);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${responseBody}`));
          }
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function testConnection() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: supabaseUrl,
      port: 443,
      path: '/rest/v1/',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      }
    };

    const req = https.request(options, (res) => {
      let responseBody = '';

      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        console.log('🔗 Connection test status:', res.statusCode);
        console.log('📡 Response headers:', res.headers);
        resolve({
          statusCode: res.statusCode,
          body: responseBody,
          headers: res.headers
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function setupDatabase() {
  try {
    console.log('🚀 Testing Supabase connection...');

    const connectionTest = await testConnection();
    console.log('✅ Connection test completed with status:', connectionTest.statusCode);

    if (connectionTest.statusCode !== 200) {
      console.error('❌ Connection failed. Response:', connectionTest.body);
      return;
    }

    // Let's try a simpler approach - just test if we can read from an existing table
    console.log('🔍 Checking existing tables...');

    const checkOptions = {
      hostname: supabaseUrl,
      port: 443,
      path: '/rest/v1/information_schema.tables?select=table_name&table_schema=eq.public',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Accept': 'application/json'
      }
    };

    const checkReq = https.request(checkOptions, (res) => {
      let responseBody = '';

      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        console.log('📊 Tables check status:', res.statusCode);
        if (res.statusCode === 200) {
          try {
            const tables = JSON.parse(responseBody);
            console.log('📋 Existing tables:', tables.map(t => t.table_name));

            // Now let's try to create a simple table using REST API
            createTablesViaREST();

          } catch (e) {
            console.log('📋 Tables response:', responseBody);
          }
        } else {
          console.error('❌ Tables check failed:', responseBody);
        }
      });
    });

    checkReq.on('error', (error) => {
      console.error('💥 Tables check error:', error);
    });

    checkReq.end();

  } catch (error) {
    console.error('💥 Setup failed:', error);
  }
}

async function createTablesViaREST() {
  console.log('🔨 Attempting to create tables using Supabase client...');

  // Since direct SQL execution is not working, let's use Supabase client for basic operations
  const { createClient } = require('@supabase/supabase-js');

  const supabase = createClient(
    `https://${supabaseUrl}`,
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllZHZkd2VkaG9ldHh1a2FibHhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc2MDExMTgsImV4cCI6MjA1MzE3NzExOH0.TgCWsK0tWZEjFmE7P4HKc4FMqKx8e8KdXw5y2QkQjZo'
  );

  try {
    // Test if we can at least connect and check existing data
    console.log('🔍 Testing basic Supabase operations...');

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (error) {
      console.log('📝 Users table doesn\'t exist yet:', error.message);

      // Try to check what tables do exist
      const { data: tableList, error: tableError } = await supabase
        .rpc('get_table_names');

      if (tableError) {
        console.log('💡 Database is ready for schema creation via Supabase Dashboard');
        console.log('🎯 Next step: Go to https://supabase.com/dashboard and run the SQL script manually');

        displayManualInstructions();
      }
    } else {
      console.log('✅ Users table already exists with', data.length, 'records');
    }

  } catch (err) {
    console.log('💡 Database needs schema setup');
    displayManualInstructions();
  }
}

function displayManualInstructions() {
  console.log('\n🎯 Manual Database Setup Instructions:');
  console.log('=======================================');
  console.log('1. Go to https://supabase.com/dashboard');
  console.log('2. Select your project: yedvdwedhoetxukablxf');
  console.log('3. Go to SQL Editor');
  console.log('4. Create a new query');
  console.log('5. Copy and paste the contents of supabase_setup.sql');
  console.log('6. Click "Run" to execute the schema');
  console.log('\nAlternatively:');
  console.log('7. Copy this connection string and run with psql:');
  console.log(`   postgresql://postgres:6sWoecfvgYgbC0yu@db.${supabaseUrl}:5432/postgres`);
  console.log('\n✨ After setup, ConvertCast will be fully operational!');
}

// Run the setup
if (require.main === module) {
  setupDatabase().catch(console.error);
}

module.exports = { setupDatabase, testConnection };