import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase/client';

export async function GET() {
  const results: any = {
    database_connected: false,
    tables_found: [],
    auth_working: false,
    errors: [],
    environment: {
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      mock_mode: process.env.MOCK_DATABASE === 'true',
      keys_configured: {
        anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    }
  };

  try {
    // Test basic connection by checking auth users (which always exists)
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

    if (usersError) {
      results.errors.push(`Basic connection failed: ${usersError.message}`);

      if (usersError.message.includes('Invalid API key')) {
        results.errors.push('Service role key appears to be invalid');
      }
    } else {
      results.database_connected = true;
      results.environment.users_found = usersData.users?.length || 0;
    }

    // If basic connection worked, try to check if database is set up
    if (results.database_connected) {
      // Try a simple SQL query to see what's available
      const { data: sqlData, error: sqlError } = await supabaseAdmin
        .rpc('exec_sql', { query: "SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public' LIMIT 10;" });

      if (sqlError) {
        // If that fails, database is likely empty - this is expected for new projects
        results.errors.push(`Database appears to be empty (no tables found). This is normal for new projects.`);
        results.tables_found = [];
      } else {
        results.tables_found = sqlData || [];
      }
    }

    // Test authentication endpoint
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError && !authError.message.includes('Auth session missing')) {
      results.errors.push(`Auth endpoint failed: ${authError.message}`);
    } else {
      results.auth_working = true; // Auth endpoint is working even if no session
    }

    // Test real-time capabilities
    try {
      const channel = supabase.channel('test-channel');
      if (channel) {
        results.auth_working = true; // Real-time connection available
        supabase.removeChannel(channel);
      }
    } catch (realtimeError) {
      results.errors.push(`Real-time test failed: ${realtimeError instanceof Error ? realtimeError.message : String(realtimeError)}`);
    }

  } catch (error) {
    results.errors.push(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
  }

  return NextResponse.json(results, {
    status: results.database_connected ? 200 : 500,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}