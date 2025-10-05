/**
 * Event Analytics Tracking Helper
 * Production-ready analytics tracking for events
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

// Initialize Supabase client with service role for analytics
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface EventAnalyticsUpdate {
  total_registrations?: number;
  email_registrations?: number;
  sms_registrations?: number;
  social_registrations?: number;
  notifications_sent?: number;
  notifications_opened?: number;
  notifications_clicked?: number;
  viewers_attended?: number;
  peak_concurrent_viewers?: number;
  total_engagement_actions?: number;
  total_revenue?: number;
  conversion_rate?: number;
  average_watch_time?: number;
}

/**
 * Increment an analytics counter for an event
 */
export async function incrementEventCounter(
  eventId: string,
  counterName: keyof EventAnalyticsUpdate,
  incrementBy: number = 1
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: analytics } = await supabaseAdmin
      .from('event_analytics')
      .select('*')
      .eq('event_id', eventId)
      .single();

    if (!analytics) {
      console.error('Analytics record not found for event:', eventId);
      return { success: false, error: 'Analytics record not found' };
    }

    const currentValue = (analytics[counterName] as number) || 0;
    const newValue = currentValue + incrementBy;

    const { error } = await supabaseAdmin
      .from('event_analytics')
      .update({
        [counterName]: newValue,
        updated_at: new Date().toISOString(),
      })
      .eq('event_id', eventId);

    if (error) {
      console.error(`Failed to increment ${counterName}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Incremented ${counterName} for event ${eventId}: ${currentValue} → ${newValue}`);
    return { success: true };
  } catch (error) {
    console.error('Error incrementing counter:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Track viewer registration
 */
export async function trackRegistration(
  eventId: string,
  source: 'email' | 'sms' | 'social' = 'email'
): Promise<{ success: boolean }> {
  const sourceCounterMap = {
    email: 'email_registrations',
    sms: 'sms_registrations',
    social: 'social_registrations',
  };

  await Promise.all([
    incrementEventCounter(eventId, 'total_registrations'),
    incrementEventCounter(eventId, sourceCounterMap[source] as any),
  ]);

  return { success: true };
}

/**
 * Track notification sent
 */
export async function trackNotificationSent(
  eventId: string,
  count: number = 1
): Promise<{ success: boolean }> {
  return await incrementEventCounter(eventId, 'notifications_sent', count);
}

/**
 * Track notification opened
 */
export async function trackNotificationOpened(
  eventId: string
): Promise<{ success: boolean }> {
  return await incrementEventCounter(eventId, 'notifications_opened');
}

/**
 * Track notification link clicked
 */
export async function trackNotificationClicked(
  eventId: string
): Promise<{ success: boolean }> {
  return await incrementEventCounter(eventId, 'notifications_clicked');
}

/**
 * Track viewer attendance (when they join the watch page)
 */
export async function trackViewerAttendance(
  eventId: string,
  registrationId: string
): Promise<{ success: boolean }> {
  try {
    // Mark registration as attended
    const { error: regError } = await supabaseAdmin
      .from('registrations')
      .update({
        attended: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', registrationId);

    if (regError) {
      console.error('Failed to mark registration as attended:', regError);
    }

    // Increment viewers attended
    await incrementEventCounter(eventId, 'viewers_attended');

    return { success: true };
  } catch (error) {
    console.error('Error tracking attendance:', error);
    return { success: false };
  }
}

/**
 * Update peak concurrent viewers if current count is higher
 */
export async function updatePeakViewers(
  eventId: string,
  currentViewers: number
): Promise<{ success: boolean }> {
  try {
    const { data: analytics } = await supabaseAdmin
      .from('event_analytics')
      .select('peak_concurrent_viewers')
      .eq('event_id', eventId)
      .single();

    if (!analytics) {
      return { success: false };
    }

    const currentPeak = analytics.peak_concurrent_viewers || 0;

    if (currentViewers > currentPeak) {
      const { error } = await supabaseAdmin
        .from('event_analytics')
        .update({
          peak_concurrent_viewers: currentViewers,
          updated_at: new Date().toISOString(),
        })
        .eq('event_id', eventId);

      if (error) {
        console.error('Failed to update peak viewers:', error);
        return { success: false };
      }

      console.log(`✅ New peak viewers for event ${eventId}: ${currentPeak} → ${currentViewers}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating peak viewers:', error);
    return { success: false };
  }
}

/**
 * Track engagement action (chat, reaction, poll response, etc.)
 */
export async function trackEngagementAction(
  eventId: string
): Promise<{ success: boolean }> {
  return await incrementEventCounter(eventId, 'total_engagement_actions');
}

/**
 * Track revenue from conversions
 */
export async function trackRevenue(
  eventId: string,
  amount: number
): Promise<{ success: boolean }> {
  try {
    const { data: analytics } = await supabaseAdmin
      .from('event_analytics')
      .select('total_revenue')
      .eq('event_id', eventId)
      .single();

    if (!analytics) {
      return { success: false };
    }

    const newTotal = (parseFloat(analytics.total_revenue?.toString() || '0') + amount).toFixed(2);

    const { error } = await supabaseAdmin
      .from('event_analytics')
      .update({
        total_revenue: parseFloat(newTotal),
        updated_at: new Date().toISOString(),
      })
      .eq('event_id', eventId);

    if (error) {
      console.error('Failed to track revenue:', error);
      return { success: false };
    }

    console.log(`✅ Tracked revenue for event ${eventId}: +$${amount}`);
    return { success: true };
  } catch (error) {
    console.error('Error tracking revenue:', error);
    return { success: false };
  }
}

/**
 * Update watch time for event
 */
export async function updateWatchTime(
  eventId: string,
  registrationId: string,
  watchTimeSeconds: number
): Promise<{ success: boolean }> {
  try {
    // Update registration attendance duration
    const { error: regError } = await supabaseAdmin
      .from('registrations')
      .update({
        attendance_duration: watchTimeSeconds,
        updated_at: new Date().toISOString(),
      })
      .eq('id', registrationId);

    if (regError) {
      console.error('Failed to update attendance duration:', regError);
    }

    // Calculate and update average watch time
    const { data: registrations } = await supabaseAdmin
      .from('registrations')
      .select('attendance_duration')
      .eq('event_id', eventId)
      .eq('attended', true);

    if (registrations && registrations.length > 0) {
      const totalTime = registrations.reduce((sum, reg) => sum + (reg.attendance_duration || 0), 0);
      const avgTime = Math.round(totalTime / registrations.length);

      await supabaseAdmin
        .from('event_analytics')
        .update({
          average_watch_time: avgTime,
          updated_at: new Date().toISOString(),
        })
        .eq('event_id', eventId);
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating watch time:', error);
    return { success: false };
  }
}

/**
 * Calculate and update conversion rate
 */
export async function updateConversionRate(
  eventId: string,
  conversions: number
): Promise<{ success: boolean }> {
  try {
    const { data: analytics } = await supabaseAdmin
      .from('event_analytics')
      .select('viewers_attended')
      .eq('event_id', eventId)
      .single();

    if (!analytics || analytics.viewers_attended === 0) {
      return { success: false };
    }

    const rate = ((conversions / analytics.viewers_attended) * 100).toFixed(2);

    const { error } = await supabaseAdmin
      .from('event_analytics')
      .update({
        conversion_rate: parseFloat(rate),
        updated_at: new Date().toISOString(),
      })
      .eq('event_id', eventId);

    if (error) {
      console.error('Failed to update conversion rate:', error);
      return { success: false };
    }

    console.log(`✅ Updated conversion rate for event ${eventId}: ${rate}%`);
    return { success: true };
  } catch (error) {
    console.error('Error updating conversion rate:', error);
    return { success: false };
  }
}

/**
 * Calculate and update registration to attendance rate
 */
export async function updateAttendanceRate(eventId: string): Promise<{ success: boolean }> {
  try {
    const { data: analytics } = await supabaseAdmin
      .from('event_analytics')
      .select('total_registrations, viewers_attended')
      .eq('event_id', eventId)
      .single();

    if (!analytics || analytics.total_registrations === 0) {
      return { success: false };
    }

    const rate = ((analytics.viewers_attended / analytics.total_registrations) * 100).toFixed(2);

    const { error } = await supabaseAdmin
      .from('event_analytics')
      .update({
        registration_to_attendance_rate: parseFloat(rate),
        updated_at: new Date().toISOString(),
      })
      .eq('event_id', eventId);

    if (error) {
      console.error('Failed to update attendance rate:', error);
      return { success: false };
    }

    console.log(`✅ Updated attendance rate for event ${eventId}: ${rate}%`);
    return { success: true };
  } catch (error) {
    console.error('Error updating attendance rate:', error);
    return { success: false };
  }
}

/**
 * Mark event as started
 */
export async function markEventStarted(eventId: string): Promise<{ success: boolean }> {
  try {
    const { error } = await supabaseAdmin
      .from('event_analytics')
      .update({
        event_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('event_id', eventId);

    if (error) {
      console.error('Failed to mark event as started:', error);
      return { success: false };
    }

    console.log(`✅ Marked event ${eventId} as started`);
    return { success: true };
  } catch (error) {
    console.error('Error marking event as started:', error);
    return { success: false };
  }
}

/**
 * Mark event as ended
 */
export async function markEventEnded(eventId: string): Promise<{ success: boolean }> {
  try {
    const { error } = await supabaseAdmin
      .from('event_analytics')
      .update({
        event_ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('event_id', eventId);

    if (error) {
      console.error('Failed to mark event as ended:', error);
      return { success: false };
    }

    // Calculate final attendance rate
    await updateAttendanceRate(eventId);

    console.log(`✅ Marked event ${eventId} as ended`);
    return { success: true };
  } catch (error) {
    console.error('Error marking event as ended:', error);
    return { success: false };
  }
}

/**
 * Get complete analytics for an event
 */
export async function getEventAnalytics(eventId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('event_analytics')
      .select('*')
      .eq('event_id', eventId)
      .single();

    if (error) {
      console.error('Failed to fetch event analytics:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching event analytics:', error);
    return null;
  }
}
