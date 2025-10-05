import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateNotificationSchedule } from '@/lib/notifications/notificationScheduler';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface NotificationTiming {
  enabled: boolean;
  timing: string;
  label: string;
}

interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  emailTimings: NotificationTiming[];
  smsTimings: NotificationTiming[];
}

// Mapping of timing identifiers to minutes before/after event
const TIMING_MAP: Record<string, number> = {
  '1_week_before': 10080,      // 7 days * 24 hours * 60 minutes
  '1_day_before': 1440,         // 24 hours * 60 minutes
  '1_hour_before': 60,
  '15_min_before': 15,
  '3_min_before': 3,
  '5_min_after': -5,            // Negative for after event
  '10_min_after': -10,
  '15_min_after': -15,
};

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await context.params;
    const settings: NotificationSettings = await request.json();

    // Fetch event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Update event notification settings
    const { error: updateError } = await supabase
      .from('events')
      .update({
        notification_settings: {
          email_enabled: settings.emailEnabled,
          sms_enabled: settings.smsEnabled,
          auto_schedule: true,
        },
      })
      .eq('id', eventId);

    if (updateError) {
      throw updateError;
    }

    // Delete existing scheduled notifications for this event
    await supabase
      .from('event_notifications')
      .delete()
      .eq('event_id', eventId)
      .eq('status', 'scheduled');

    // Create new notification records
    const eventStartTime = new Date(event.scheduled_start);
    const notificationsToCreate = [];

    // Process email notifications
    if (settings.emailEnabled) {
      for (const timing of settings.emailTimings) {
        if (timing.enabled) {
          const minutesOffset = TIMING_MAP[timing.timing];
          if (minutesOffset !== undefined) {
            const scheduledTime = new Date(eventStartTime.getTime() + minutesOffset * 60 * 1000);

            notificationsToCreate.push({
              event_id: eventId,
              notification_type: 'email',
              notification_timing: timing.timing,
              scheduled_time: scheduledTime.toISOString(),
              status: 'scheduled',
              template_name: minutesOffset > 0 ? 'event_reminder' : 'event_started_reminder',
              recipients_count: 0,
            });
          }
        }
      }
    }

    // Process SMS notifications
    if (settings.smsEnabled) {
      for (const timing of settings.smsTimings) {
        if (timing.enabled) {
          const minutesOffset = TIMING_MAP[timing.timing];
          if (minutesOffset !== undefined) {
            const scheduledTime = new Date(eventStartTime.getTime() + minutesOffset * 60 * 1000);

            notificationsToCreate.push({
              event_id: eventId,
              notification_type: 'sms',
              notification_timing: timing.timing,
              scheduled_time: scheduledTime.toISOString(),
              status: 'scheduled',
              template_name: minutesOffset > 0 ? 'event_reminder_sms' : 'event_started_reminder_sms',
              recipients_count: 0,
            });
          }
        }
      }
    }

    // Insert notification records
    if (notificationsToCreate.length > 0) {
      const { error: insertError } = await supabase
        .from('event_notifications')
        .insert(notificationsToCreate);

      if (insertError) {
        console.error('Error creating notifications:', insertError);
        throw insertError;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Notification settings saved successfully',
      notificationsScheduled: notificationsToCreate.length,
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to update notification settings' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await context.params;

    // Fetch event notification settings
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('notification_settings, scheduled_start')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Fetch scheduled notifications
    const { data: notifications, error: notifError } = await supabase
      .from('event_notifications')
      .select('*')
      .eq('event_id', eventId)
      .eq('status', 'scheduled');

    if (notifError) {
      throw notifError;
    }

    // Build response with current settings
    const emailTimings = [];
    const smsTimings = [];

    for (const [timing, _] of Object.entries(TIMING_MAP)) {
      const emailNotif = notifications?.find(
        n => n.notification_type === 'email' && n.notification_timing === timing
      );
      const smsNotif = notifications?.find(
        n => n.notification_type === 'sms' && n.notification_timing === timing
      );

      if (emailNotif) {
        emailTimings.push({
          enabled: true,
          timing,
          label: timing.replace(/_/g, ' '),
        });
      }

      if (smsNotif) {
        smsTimings.push({
          enabled: true,
          timing,
          label: timing.replace(/_/g, ' '),
        });
      }
    }

    return NextResponse.json({
      success: true,
      settings: {
        emailEnabled: event.notification_settings?.email_enabled ?? true,
        smsEnabled: event.notification_settings?.sms_enabled ?? false,
        emailTimings,
        smsTimings,
      },
      notificationsScheduled: notifications?.length ?? 0,
    });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification settings' },
      { status: 500 }
    );
  }
}
