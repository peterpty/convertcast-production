import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    console.log('🔍 DEBUG: Investigating stream database records...');

    // Initialize Supabase service client (bypasses RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase credentials',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Query all streams with relevant fields
    const { data: streams, error: streamError } = await supabase
      .from('streams')
      .select(`
        id,
        event_id,
        mux_stream_id,
        mux_playback_id,
        stream_key,
        status,
        created_at,
        updated_at,
        events (
          id,
          title,
          user_id
        )
      `)
      .order('created_at', { ascending: false });

    if (streamError) {
      console.error('❌ Failed to query streams:', streamError);
      return NextResponse.json({
        success: false,
        error: streamError.message,
        details: streamError,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    // Analyze streams for issues
    const streamsWithoutPlaybackId = streams?.filter(s => !s.mux_playback_id) || [];
    const streamsWithoutStreamId = streams?.filter(s => !s.mux_stream_id) || [];
    const streamsWithoutStreamKey = streams?.filter(s => !s.stream_key) || [];

    // Build detailed stream list with issue flagging
    const streamDetails = streams?.map(stream => {
      const issues: string[] = [];

      if (!stream.mux_playback_id) issues.push('MISSING_PLAYBACK_ID');
      if (!stream.mux_stream_id) issues.push('MISSING_STREAM_ID');
      if (!stream.stream_key) issues.push('MISSING_STREAM_KEY');

      return {
        id: stream.id,
        event_id: stream.event_id,
        event_title: stream.events?.title || 'No event',
        user_id: stream.events?.user_id || 'Unknown',
        mux_stream_id: stream.mux_stream_id || null,
        mux_playback_id: stream.mux_playback_id || null,
        stream_key: stream.stream_key || null,
        status: stream.status,
        created_at: stream.created_at,
        updated_at: stream.updated_at,
        issues: issues.length > 0 ? issues : null,
        health_status: issues.length === 0 ? '✅ HEALTHY' : '⚠️ INCOMPLETE'
      };
    }) || [];

    // Build summary statistics
    const summary = {
      total_streams: streams?.length || 0,
      healthy_streams: streamDetails.filter(s => s.health_status === '✅ HEALTHY').length,
      streams_missing_playback_id: streamsWithoutPlaybackId.length,
      streams_missing_stream_id: streamsWithoutStreamId.length,
      streams_missing_stream_key: streamsWithoutStreamKey.length,
      critical_issues: streamsWithoutPlaybackId.length > 0
    };

    // Build diagnosis report
    const diagnosis = {
      viewer_page_issue_likely: streamsWithoutPlaybackId.length > 0,
      explanation: streamsWithoutPlaybackId.length > 0
        ? `⚠️ ${streamsWithoutPlaybackId.length} stream(s) have NULL mux_playback_id. The viewer page at /watch/[id] looks up streams using .eq('mux_playback_id', streamId), which will fail for these streams, causing "Stream not available" error.`
        : '✅ All streams have mux_playback_id values. The issue may be elsewhere.',
      recommended_fix: streamsWithoutPlaybackId.length > 0
        ? 'Update the missing mux_playback_id values in the database, or modify the viewer page to look up by stream.id (UUID) instead of mux_playback_id.'
        : 'Check if the URL being used contains the correct playback ID, or verify network/authentication issues.'
    };

    console.log('✅ Stream diagnostic complete:', summary);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
      diagnosis,
      streams: streamDetails,
      raw_query: {
        table: 'streams',
        total_records: streams?.length || 0,
        columns_queried: ['id', 'event_id', 'mux_stream_id', 'mux_playback_id', 'stream_key', 'status', 'created_at', 'updated_at']
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Diagnostic endpoint failed:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
