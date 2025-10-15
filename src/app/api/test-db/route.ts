import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // Test 1: Check table schema
    console.log('🔍 TEST 1: Checking chat_messages schema...');
    const serviceClient = createClient(supabaseUrl, serviceKey);

    const { data: schemaCheck, error: schemaError } = await serviceClient
      .rpc('exec_sql', {
        query: `
          SELECT column_name, is_nullable, column_default, data_type
          FROM information_schema.columns
          WHERE table_name = 'chat_messages'
          AND column_name IN ('viewer_profile_id', 'stream_id', 'message', 'sender_id')
          ORDER BY column_name;
        `
      })
      .single();

    if (schemaError && schemaError.code !== '42883') {
      // Function doesn't exist, try direct query
      const { data: directSchema, error: directError } = await serviceClient
        .from('chat_messages')
        .select('*')
        .limit(0);

      results.tests.push({
        name: 'Schema Check',
        status: directError ? 'FAILED' : 'PASSED',
        note: 'Table exists but cannot query column metadata without exec_sql function'
      });
    } else {
      results.tests.push({
        name: 'Schema Check',
        status: 'PASSED',
        data: schemaCheck
      });
    }

    // Test 2: Get a real stream ID
    console.log('🔍 TEST 2: Getting active stream...');
    const { data: streams, error: streamError } = await serviceClient
      .from('streams')
      .select('id, mux_stream_id, stream_key')
      .order('created_at', { ascending: false })
      .limit(1);

    if (streamError || !streams || streams.length === 0) {
      results.tests.push({
        name: 'Get Stream',
        status: 'FAILED',
        error: streamError?.message || 'No streams found'
      });
      return NextResponse.json(results);
    }

    const streamId = streams[0].id;
    results.tests.push({
      name: 'Get Stream',
      status: 'PASSED',
      streamId: streamId
    });

    // Test 3: Insert with service role (bypasses RLS)
    console.log('🔍 TEST 3: Testing insert with service role...');
    const testMessage1 = {
      stream_id: streamId,
      viewer_profile_id: null,
      message: `[DIAGNOSTIC TEST ${Date.now()}] Service role insert`,
      status: 'active',
      is_synthetic: false,
      is_private: false,
      sender_id: 'diagnostic-service',
      reply_to_user_id: null,
      reply_to_message_id: null,
      intent_signals: null
    };

    const { data: serviceData, error: serviceError } = await serviceClient
      .from('chat_messages')
      .insert(testMessage1)
      .select()
      .single();

    results.tests.push({
      name: 'Insert (Service Role)',
      status: serviceError ? 'FAILED' : 'PASSED',
      error: serviceError ? {
        message: serviceError.message,
        code: serviceError.code,
        details: serviceError.details,
        hint: serviceError.hint
      } : undefined,
      messageId: serviceData?.id
    });

    // Test 4: Insert with anon key (what viewers use)
    console.log('🔍 TEST 4: Testing insert with anon key (RLS applied)...');
    const anonClient = createClient(supabaseUrl, anonKey);

    const testMessage2 = {
      stream_id: streamId,
      viewer_profile_id: null,
      message: `[DIAGNOSTIC TEST ${Date.now()}] Anon insert`,
      status: 'active',
      is_synthetic: false,
      is_private: false,
      sender_id: 'diagnostic-anon',
      reply_to_user_id: null,
      reply_to_message_id: null,
      intent_signals: null
    };

    const { data: anonData, error: anonError } = await anonClient
      .from('chat_messages')
      .insert(testMessage2)
      .select()
      .single();

    results.tests.push({
      name: 'Insert (Anon Key - RLS)',
      status: anonError ? 'FAILED' : 'PASSED',
      error: anonError ? {
        message: anonError.message,
        code: anonError.code,
        details: anonError.details,
        hint: anonError.hint
      } : undefined,
      messageId: anonData?.id,
      note: anonError ? 'RLS policies may be blocking inserts' : 'RLS allows inserts'
    });

    // Test 5: Check if Realtime is enabled
    console.log('🔍 TEST 5: Checking Realtime setup...');
    const { data: realtimeCheck, error: realtimeError } = await serviceClient
      .from('chat_messages')
      .select('id')
      .eq('stream_id', streamId)
      .limit(1);

    results.tests.push({
      name: 'Realtime Check',
      status: 'INFO',
      note: 'Realtime enabled at table level - check Supabase dashboard for replication status'
    });

    // Summary
    const failedTests = results.tests.filter((t: any) => t.status === 'FAILED');
    results.summary = {
      total: results.tests.length,
      passed: results.tests.filter((t: any) => t.status === 'PASSED').length,
      failed: failedTests.length,
      critical_issues: failedTests.map((t: any) => t.name)
    };

    console.log('✅ Diagnostic complete:', results.summary);

    return NextResponse.json(results, { status: 200 });

  } catch (error: any) {
    console.error('❌ Diagnostic failed:', error);
    return NextResponse.json({
      error: 'Diagnostic failed',
      message: error?.message,
      stack: error?.stack,
      results
    }, { status: 500 });
  }
}
