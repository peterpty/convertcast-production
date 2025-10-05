import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';

/**
 * GET /api/events
 * List all events for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // upcoming, past, live, all
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('📋 Fetching events for user:', user.email, 'status:', status);

    // Build query
    let query = supabase
      .from('events')
      .select(`
        *,
        streams (
          id,
          status,
          mux_playback_id,
          viewer_count,
          peak_viewers
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('scheduled_start', { ascending: false });

    // Filter by status
    if (status === 'upcoming') {
      query = query
        .gte('scheduled_start', new Date().toISOString())
        .in('status', ['scheduled', 'draft']);
    } else if (status === 'past') {
      query = query
        .in('status', ['completed', 'cancelled']);
    } else if (status === 'live') {
      query = query.eq('status', 'live');
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: events, error: eventsError, count } = await query;

    if (eventsError) {
      console.error('❌ Failed to fetch events:', eventsError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch events',
          details: eventsError.message,
        },
        { status: 500 }
      );
    }

    // Fetch analytics for each event
    const eventsWithAnalytics = await Promise.all(
      (events || []).map(async (event) => {
        const { count: registrationCount } = await supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id);

        const { count: notificationCount } = await supabase
          .from('event_notifications')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id)
          .eq('status', 'sent');

        // Fetch event analytics if exists
        const { data: analytics } = await supabase
          .from('event_analytics')
          .select('*')
          .eq('event_id', event.id)
          .single();

        return {
          ...event,
          registration_count: registrationCount || 0,
          notifications_sent: notificationCount || 0,
          analytics: analytics || null,
        };
      })
    );

    console.log(`✅ Found ${eventsWithAnalytics.length} events`);

    return NextResponse.json({
      success: true,
      events: eventsWithAnalytics,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('❌ Error fetching events:', error);
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
