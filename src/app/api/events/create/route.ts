import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import {
  calculateNotificationSchedule,
  validateNotificationSchedule,
  intervalToNotificationTiming,
} from '@/lib/notifications/notificationScheduler';

/**
 * POST /api/events/create
 * Create a new scheduled event with automatic notification scheduling
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
      scheduled_start,
      scheduled_end,
      timezone,
      notification_settings,
      registration_enabled,
      max_registrations,
      selected_intervals,
      preferred_integration_id,
      selected_contact_ids,
    } = body;

    // Validation
    if (!title || !scheduled_start) {
      return NextResponse.json(
        { success: false, error: 'Title and scheduled start time are required' },
        { status: 400 }
      );
    }

    const scheduledStartDate = new Date(scheduled_start);
    const now = new Date();

    if (scheduledStartDate <= now) {
      return NextResponse.json(
        { success: false, error: 'Event must be scheduled in the future' },
        { status: 400 }
      );
    }

    console.log('📅 Creating scheduled event for user:', user.email);
    console.log('⏰ Event time:', scheduledStartDate.toISOString());

    // Calculate notification schedule
    const notificationSchedule = calculateNotificationSchedule(scheduledStartDate);
    const scheduleValidation = validateNotificationSchedule(notificationSchedule);

    if (!scheduleValidation.valid) {
      console.error('❌ Invalid notification schedule:', scheduleValidation.errors);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid notification schedule',
          details: scheduleValidation.errors,
        },
        { status: 400 }
      );
    }

    // Log warnings if any intervals were filtered out
    if (scheduleValidation.warnings.length > 0) {
      console.warn('⚠️ Notification schedule warnings:', scheduleValidation.warnings);
    }

    // Filter to only valid intervals
    const { filterValidIntervals } = await import('@/lib/notifications/notificationScheduler');
    const filteredSchedule = filterValidIntervals(notificationSchedule);

    // Create event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        user_id: user.id,
        title,
        description: description || '',
        scheduled_start: scheduledStartDate.toISOString(),
        scheduled_end: scheduled_end || new Date(scheduledStartDate.getTime() + 3600000).toISOString(),
        timezone: timezone || 'America/New_York',
        status: 'scheduled',
        notification_settings: notification_settings || {
          email_enabled: true,
          sms_enabled: false,
          auto_schedule: true,
          custom_message: null,
        },
        registration_enabled: registration_enabled !== false,
        max_registrations: max_registrations || null,
        preferred_integration_id: preferred_integration_id || null,
        selected_contact_ids: selected_contact_ids || null,
      })
      .select()
      .single();

    if (eventError || !event) {
      console.error('❌ Failed to create event:', eventError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create event',
          details: eventError?.message,
        },
        { status: 500 }
      );
    }

    console.log('✅ Event created:', event.id);

    // Schedule notifications (only selected intervals or all if auto-schedule)
    // Use filtered schedule to ensure only valid intervals
    const intervalsToSchedule = selected_intervals && Array.isArray(selected_intervals)
      ? filteredSchedule.intervals.filter(interval => selected_intervals.includes(interval.name))
      : filteredSchedule.intervals;

    console.log(`📅 Scheduling ${intervalsToSchedule.length} valid notifications (${scheduleValidation.warnings.length} intervals skipped)`);

    const notificationInserts = intervalsToSchedule.map(interval => ({
      event_id: event.id,
      notification_type: notification_settings?.sms_enabled ? 'both' : 'email',
      notification_timing: intervalToNotificationTiming(interval.name),
      scheduled_time: interval.scheduledTime.toISOString(),
      status: 'scheduled',
      template_name: 'Default Event Reminder',
    }));

    const { data: notifications, error: notificationError } = await supabase
      .from('event_notifications')
      .insert(notificationInserts)
      .select();

    if (notificationError) {
      console.error('⚠️ Failed to schedule notifications:', notificationError);
      // Don't fail the whole request, just log the error
    } else {
      console.log(`✅ Scheduled ${notifications?.length || 0} notifications`);
    }

    // Generate registration URL
    const registrationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/register/${event.id}`;

    // Update event with registration URL
    await supabase
      .from('events')
      .update({ registration_url: registrationUrl })
      .eq('id', event.id);

    return NextResponse.json(
      {
        success: true,
        event: {
          ...event,
          registration_url: registrationUrl,
        },
        notifications: notifications || [],
        schedule: notificationSchedule,
        message: 'Event created successfully',
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
