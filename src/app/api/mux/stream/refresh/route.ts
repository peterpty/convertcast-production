import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import { muxProductionService } from '@/lib/streaming/muxProductionService';

/**
 * POST /api/mux/stream/refresh
 * Refresh stream key for a user's stream
 * Creates new Mux credentials and updates database
 */
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
    const { streamId } = body;

    if (!streamId) {
      return NextResponse.json(
        { success: false, error: 'Stream ID is required' },
        { status: 400 }
      );
    }

    console.log('🔄 Refreshing stream key for stream:', streamId);

    // Fetch the stream and verify ownership through event relationship
    const { data: stream, error: streamError } = await supabase
      .from('streams')
      .select(`
        id,
        mux_stream_id,
        event_id,
        events!inner (
          id,
          user_id,
          title
        )
      `)
      .eq('id', streamId)
      .single();

    if (streamError || !stream) {
      console.error('❌ Stream not found:', streamError);
      return NextResponse.json(
        { success: false, error: 'Stream not found' },
        { status: 404 }
      );
    }

    // Verify ownership - check if the event belongs to the current user
    if (stream.events.user_id !== user.id) {
      console.error('❌ Unauthorized access attempt - user does not own this stream');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - You do not own this stream' },
        { status: 403 }
      );
    }

    console.log(`✅ Ownership verified for user ${user.email} on stream ${streamId}`);

    // Create a NEW Mux stream with fresh credentials
    console.log('🎬 Creating new Mux stream with fresh credentials...');
    const newMuxStream = await muxProductionService.createLiveStream(
      stream.events.title || 'Live Stream'
    );

    console.log('✅ New Mux stream created:', newMuxStream.id);
    console.log('🔑 New stream key generated:', newMuxStream.stream_key.substring(0, 8) + '...');

    // Update the database with new credentials
    const { data: updatedStream, error: updateError } = await supabase
      .from('streams')
      .update({
        mux_stream_id: newMuxStream.id,
        mux_playback_id: newMuxStream.playback_id,
        stream_key: newMuxStream.stream_key,
        rtmp_server_url: newMuxStream.rtmp_server_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', streamId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Failed to update stream in database:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to save new credentials',
          details: updateError.message
        },
        { status: 500 }
      );
    }

    console.log('✅ Database updated with new credentials');

    // Disable the old Mux stream to prevent abuse
    if (stream.mux_stream_id) {
      try {
        console.log('🔒 Disabling old Mux stream:', stream.mux_stream_id);
        await muxProductionService.toggleStream(stream.mux_stream_id, false);
        console.log('✅ Old stream disabled successfully');
      } catch (disableError) {
        // Non-critical error - log but don't fail the request
        console.warn('⚠️ Failed to disable old Mux stream (non-critical):', disableError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Stream key refreshed successfully',
      stream: {
        id: updatedStream.id,
        stream_key: updatedStream.stream_key,
        rtmp_server_url: updatedStream.rtmp_server_url,
        mux_stream_id: updatedStream.mux_stream_id,
        mux_playback_id: updatedStream.mux_playback_id
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error refreshing stream key:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to refresh stream key',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
