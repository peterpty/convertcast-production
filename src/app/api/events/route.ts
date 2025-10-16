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

    // Fetch analytics for each event (with error handling to prevent 500 crashes)
    const eventsWithAnalytics = await Promise.all(
      (events || []).map(async (event) => {
        let registrationCount = 0;
        let notificationCount = 0;
        let analytics = null;

        // Try to fetch registration count
        try {
          const { count } = await supabase
            .from('registrations')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id);
          registrationCount = count || 0;
        } catch (error) {
          console.error(`Failed to fetch registration count for event ${event.id}:`, error);
        }

        // Try to fetch notification count
        try {
          const { count } = await supabase
            .from('event_notifications')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id)
            .eq('status', 'sent');
          notificationCount = count || 0;
        } catch (error) {
          console.error(`Failed to fetch notification count for event ${event.id}:`, error);
        }

        // Try to fetch event analytics (use maybeSingle to handle missing rows gracefully)
        try {
          const { data } = await supabase
            .from('event_analytics')
            .select('*')
            .eq('event_id', event.id)
            .maybeSingle(); // Returns null if no row exists, doesn't throw error
          analytics = data;
        } catch (error) {
          console.error(`Failed to fetch analytics for event ${event.id}:`, error);
        }

        return {
          ...event,
          registration_count: registrationCount,
          notifications_sent: notificationCount,
          analytics: analytics,
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

/**
 * POST /api/events
 * Create a new event for the authenticated user
 */
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const {
      title,
      description,
      date,
      time,
      duration = 60,
      timezone = 'America/New_York',
      max_attendees = 1000,
      registration_required = false,
      tags = [],
    } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Event title is required' },
        { status: 400 }
      );
    }

    if (!date || !time) {
      return NextResponse.json(
        { success: false, error: 'Event date and time are required' },
        { status: 400 }
      );
    }

    console.log('📝 Creating event for user:', user.email);

    // Combine date and time into ISO string
    const scheduled_start = new Date(`${date}T${time}`).toISOString();

    // Calculate scheduled_end based on duration (in minutes)
    const scheduled_end = new Date(
      new Date(scheduled_start).getTime() + duration * 60000
    ).toISOString();

    // Create event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        user_id: user.id,
        title,
        description: description || null,
        scheduled_start,
        scheduled_end,
        timezone,
        max_attendees,
        registration_required,
        status: 'draft',
        custom_fields: tags && tags.length > 0 ? { tags } : null,
      })
      .select()
      .single();

    if (eventError || !event) {
      console.error('❌ Failed to create event:', eventError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create event',
          details: eventError?.message || 'Unknown error',
        },
        { status: 500 }
      );
    }

    console.log('✅ Event created:', event.id);

    // Create event_analytics record
    const { error: analyticsError } = await supabase
      .from('event_analytics')
      .insert({
        event_id: event.id,
        total_registrations: 0,
        email_registrations: 0,
        sms_registrations: 0,
        social_registrations: 0,
        notifications_sent: 0,
      });

    if (analyticsError) {
      console.error('⚠️ Failed to create analytics record:', analyticsError);
      // Don't fail the request if analytics fails
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Event created successfully',
        event,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating event:', error);
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
