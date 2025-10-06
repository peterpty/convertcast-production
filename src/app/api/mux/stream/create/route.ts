import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { muxProductionService } from '@/lib/streaming/muxProductionService';
import type { Database } from '@/types/database';

// Use service role to bypass RLS for stream creation
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/mux/stream/create
 *
 * Creates a new stream for the user
 * Uses service role to bypass RLS for INSERT operations
 *
 * Body:
 * - eventId: The event ID to associate with the stream
 * - userId: The user ID (for verification)
 * - eventTitle: The event title (for Mux stream name)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🎬 [CREATE-STREAM] Creating new stream...');

    const body = await request.json();
    const { eventId, userId, eventTitle } = body;

    if (!eventId || !userId || !eventTitle) {
      return NextResponse.json(
        { error: 'Missing required fields: eventId, userId, eventTitle' },
        { status: 400 }
      );
    }

    console.log('📝 [CREATE-STREAM] Event ID:', eventId);
    console.log('👤 [CREATE-STREAM] User ID:', userId);

    // Verify the event belongs to the user
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .eq('user_id', userId)
      .single();

    if (eventError || !event) {
      console.error('❌ [CREATE-STREAM] Event verification failed:', eventError);
      return NextResponse.json(
        { error: 'Event not found or does not belong to user' },
        { status: 403 }
      );
    }

    console.log('✅ [CREATE-STREAM] Event verified');

    // Create stream in Mux
    console.log('🎬 [CREATE-STREAM] Creating Mux live stream...');
    const muxStream = await muxProductionService.createLiveStream(eventTitle);

    console.log('✅ [CREATE-STREAM] Mux stream created:', muxStream.id);

    // Save stream to database (service role bypasses RLS)
    const { data: dbStream, error: insertError } = await supabase
      .from('streams')
      .insert({
        event_id: eventId,
        mux_stream_id: muxStream.id,
        mux_playback_id: muxStream.playback_ids?.[0]?.id || null,
        stream_key: muxStream.stream_key,
        status: 'idle',
        peak_viewers: 0,
        total_viewers: 0,
        engagemax_config: {
          polls_enabled: true,
          reactions_enabled: true
        },
        autooffer_config: {
          enabled: true
        }
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ [CREATE-STREAM] Database insert failed:', insertError);
      return NextResponse.json(
        { error: 'Failed to save stream to database', details: insertError.message },
        { status: 500 }
      );
    }

    console.log('✅ [CREATE-STREAM] Stream saved to database:', dbStream.id);

    return NextResponse.json({
      success: true,
      stream: {
        id: muxStream.id,
        database_id: dbStream.id,
        rtmp_server_url: 'rtmp://global-live.mux.com/app',
        stream_key: muxStream.stream_key,
        playback_id: muxStream.playback_ids?.[0]?.id || '',
        status: muxStream.status,
        created_at: muxStream.created_at
      },
      event_id: eventId,
      message: 'Stream created successfully'
    });

  } catch (error) {
    console.error('❌ [CREATE-STREAM] Failed:', error);

    return NextResponse.json(
      {
        error: 'Failed to create stream',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
