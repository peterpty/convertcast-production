import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';

/**
 * POST /api/events/[id]/start
 * Start event (GO LIVE button) - Creates Mux stream, does NOT send notifications
 * Notifications are already sent on schedule
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await context.params;

    let response = NextResponse.next();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({ name, value, ...options });
            response = NextResponse.next({
              request: { headers: request.headers },
            });
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({ name, value: '', ...options });
            response = NextResponse.next({
              request: { headers: request.headers },
            });
            response.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    console.log('🚀 Starting event:', eventId, 'for user:', user.email);

    // Get event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .eq('user_id', user.id)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if event is already live
    if (event.status === 'live') {
      // Get existing stream
      const { data: existingStream } = await supabase
        .from('streams')
        .select('*')
        .eq('event_id', eventId)
        .eq('status', 'active')
        .single();

      if (existingStream) {
        console.log('✅ Event already live with stream:', existingStream.id);
        return NextResponse.json({
          success: true,
          message: 'Event already live',
          event,
          stream: existingStream,
        });
      }
    }

    // Check if event can be started
    if (event.status === 'completed' || event.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: `Event is ${event.status} and cannot be started` },
        { status: 400 }
      );
    }

    // Create Mux stream via existing API
    const muxResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/api/mux/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventTitle: event.title,
        eventDescription: event.description,
      }),
    });

    if (!muxResponse.ok) {
      console.error('❌ Failed to create Mux stream');
      return NextResponse.json(
        { success: false, error: 'Failed to create stream' },
        { status: 500 }
      );
    }

    const muxData = await muxResponse.json();
    console.log('✅ Mux stream created:', muxData.stream?.id);

    // Create stream in database
    const { data: stream, error: streamError } = await supabase
      .from('streams')
      .insert({
        event_id: eventId,
        mux_stream_id: muxData.stream.id,
        mux_playback_id: muxData.stream.playback_id,
        stream_key: muxData.stream.stream_key,
        rtmp_server_url: muxData.stream.rtmp_server_url,
        status: 'active',
        engagemax_config: {
          polls_enabled: true,
          quizzes_enabled: true,
          reactions_enabled: true,
          ctas_enabled: true,
        },
        autooffer_config: {
          experiments_enabled: true,
          dynamic_pricing: true,
          behavioral_triggers: true,
        },
        chat_config: {
          enabled: true,
          moderated: false,
          ai_responses: true,
        },
      })
      .select()
      .single();

    if (streamError) {
      console.error('❌ Failed to create stream record:', streamError);
      return NextResponse.json(
        { success: false, error: 'Failed to create stream record' },
        { status: 500 }
      );
    }

    // Update event status to 'live'
    const { error: updateError } = await supabase
      .from('events')
      .update({
        status: 'live',
      })
      .eq('id', eventId);

    if (updateError) {
      console.error('❌ Failed to update event status:', updateError);
    }

    // Update analytics - event started
    await supabase
      .from('event_analytics')
      .update({
        event_started_at: new Date().toISOString(),
      })
      .eq('event_id', eventId);

    console.log('✅ Event started successfully');

    // IMPORTANT: Do NOT send notifications here!
    // Notifications are already scheduled and sent automatically by cron job

    return NextResponse.json(
      {
        success: true,
        message: 'Event started successfully - Stream is live!',
        event: {
          ...event,
          status: 'live',
        },
        stream,
        studio_url: `/dashboard/stream/studio`,
        viewer_url: `/watch/${stream.mux_playback_id}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error starting event:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
