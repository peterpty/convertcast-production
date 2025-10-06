import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { muxProductionService } from '@/lib/streaming/muxProductionService';
import type { Database } from '@/types/database';

// Create Supabase client with service role for server-side operations
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/mux/stream/user
 *
 * Gets or creates a stream for the authenticated user
 * This is THE endpoint that fixes the critical bug where all users shared the same stream
 *
 * Flow:
 * 1. Authenticate user
 * 2. Get or create user's default event
 * 3. Check if user already has an active stream
 * 4. If not, create new stream in Mux AND database
 * 5. Return user-specific stream ONLY
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔐 [USER-STREAM] Fetching user-specific stream...');

    // Step 1: Authenticate user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.error('❌ [USER-STREAM] No authorization header');
      return NextResponse.json(
        { error: 'Unauthorized', message: 'No authorization header provided' },
        { status: 401 }
      );
    }

    // Get user from auth header
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('❌ [USER-STREAM] Auth failed:', authError);
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    console.log('✅ [USER-STREAM] User authenticated:', user.id);

    // Step 2: Get or create user's default event
    let event = await getUserDefaultEvent(user.id);

    if (!event) {
      console.log('📝 [USER-STREAM] No event found, creating default event...');
      event = await createDefaultEvent(user.id);
    }

    console.log('✅ [USER-STREAM] Event ready:', event.id);

    // Step 3: Check if user already has an active stream
    const { data: existingStreams, error: queryError } = await supabase
      .from('streams')
      .select('*')
      .eq('event_id', event.id)
      .in('status', ['idle', 'active'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (queryError) {
      console.error('❌ [USER-STREAM] Database query failed:', queryError);
      throw queryError;
    }

    // If user has an existing stream, return it
    if (existingStreams && existingStreams.length > 0) {
      const existingStream = existingStreams[0];
      console.log('✅ [USER-STREAM] Returning existing stream:', existingStream.id);

      return NextResponse.json({
        success: true,
        stream: {
          id: existingStream.mux_stream_id,
          rtmp_server_url: 'rtmp://global-live.mux.com/app',
          stream_key: existingStream.stream_key,
          playback_id: existingStream.mux_playback_id,
          status: existingStream.status,
          created_at: existingStream.created_at
        },
        database_id: existingStream.id,
        event_id: event.id,
        message: 'User stream retrieved successfully',
        timestamp: new Date().toISOString()
      });
    }

    // Step 4: No existing stream, create new one
    console.log('🎬 [USER-STREAM] Creating new Mux stream...');

    const muxStream = await muxProductionService.createLiveStream(
      event.title || 'Live Stream'
    );

    console.log('✅ [USER-STREAM] Mux stream created:', muxStream.id);

    // Step 5: Save stream to database with user relationship
    const { data: dbStream, error: insertError } = await supabase
      .from('streams')
      .insert({
        event_id: event.id,
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
      console.error('❌ [USER-STREAM] Database insert failed:', insertError);
      throw insertError;
    }

    console.log('✅ [USER-STREAM] Stream saved to database:', dbStream.id);

    return NextResponse.json({
      success: true,
      stream: {
        id: muxStream.id,
        rtmp_server_url: 'rtmp://global-live.mux.com/app',
        stream_key: muxStream.stream_key,
        playback_id: muxStream.playback_ids?.[0]?.id || '',
        status: muxStream.status,
        max_continuous_duration: muxStream.max_continuous_duration,
        created_at: muxStream.created_at
      },
      database_id: dbStream.id,
      event_id: event.id,
      message: 'User stream created successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [USER-STREAM] Failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * Get user's default event (or most recent event)
 */
async function getUserDefaultEvent(userId: string) {
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('❌ [USER-STREAM] Failed to get user events:', error);
    throw error;
  }

  return events && events.length > 0 ? events[0] : null;
}

/**
 * Create a default event for the user
 */
async function createDefaultEvent(userId: string) {
  const now = new Date();
  const endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now

  const { data: event, error } = await supabase
    .from('events')
    .insert({
      user_id: userId,
      title: 'My Live Stream',
      description: 'Live streaming event powered by ConvertCast',
      scheduled_start: now.toISOString(),
      scheduled_end: endTime.toISOString(),
      status: 'scheduled',
      timezone: 'UTC',
      registration_required: false
    })
    .select()
    .single();

  if (error) {
    console.error('❌ [USER-STREAM] Failed to create default event:', error);
    throw error;
  }

  console.log('✅ [USER-STREAM] Default event created:', event.id);
  return event;
}
