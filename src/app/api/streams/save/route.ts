import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client with cookie handling
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

    // Parse request body
    const body = await request.json();
    const {
      eventTitle,
      eventDescription,
      muxStreamId,
      muxPlaybackId,
      streamKey,
      rtmpServerUrl
    } = body;

    if (!eventTitle) {
      return NextResponse.json(
        { success: false, error: 'Event title is required' },
        { status: 400 }
      );
    }

    console.log('💾 Saving stream to database for user:', user.email);

    // First, check if user exists in users table, if not create them
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!existingUser) {
      // User doesn't exist in users table, create them
      const { error: userCreateError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.name || user.email!.split('@')[0],
          avatar_url: user.user_metadata?.avatar_url,
        });

      if (userCreateError) {
        console.error('❌ Failed to create user:', userCreateError);
        // Continue anyway - the user might have been created by a trigger
      }
    }

    // Create event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        user_id: user.id,
        title: eventTitle,
        description: eventDescription || 'Live streaming event',
        scheduled_start: new Date().toISOString(),
        scheduled_end: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        timezone: 'America/New_York',
        status: 'draft',
      })
      .select()
      .single();

    if (eventError || !event) {
      console.error('❌ Failed to create event:', eventError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create event',
          details: eventError?.message
        },
        { status: 500 }
      );
    }

    console.log('✅ Event created:', event.id);

    // Create stream
    const { data: stream, error: streamError } = await supabase
      .from('streams')
      .insert({
        event_id: event.id,
        mux_stream_id: muxStreamId,
        mux_playback_id: muxPlaybackId,
        stream_key: streamKey,
        rtmp_server_url: rtmpServerUrl,
        status: 'active',
        peak_viewers: 0,
        total_viewers: 0,
        engagemax_config: {
          polls_enabled: true,
          quizzes_enabled: true,
          reactions_enabled: true,
          ctas_enabled: true
        },
        autooffer_config: {
          experiments_enabled: true,
          dynamic_pricing: true,
          behavioral_triggers: true
        }
      })
      .select(`
        *,
        events (
          id,
          title,
          description,
          scheduled_start,
          scheduled_end,
          status
        )
      `)
      .single();

    if (streamError || !stream) {
      console.error('❌ Failed to create stream:', streamError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create stream',
          details: streamError?.message
        },
        { status: 500 }
      );
    }

    console.log('✅ Stream created:', stream.id);

    return NextResponse.json({
      success: true,
      stream: stream,
      event: event,
      message: 'Stream and event saved successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error saving stream:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
