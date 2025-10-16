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

    // Send NOW LIVE notifications to all registrants
    try {
      console.log('📧 Sending NOW LIVE notifications to registrants...');

      // Query all registrations for this event with viewer profiles
      const { data: registrations, error: regError } = await supabase
        .from('registrations')
        .select(`
          id,
          viewer_profile_id,
          viewer_profiles (
            id,
            email,
            phone,
            first_name,
            last_name
          )
        `)
        .eq('event_id', eventId);

      if (regError) {
        console.error('❌ Error querying registrations:', regError);
      } else if (registrations && registrations.length > 0) {
        console.log(`📋 Found ${registrations.length} registrants to notify`);

        // Import notification functions
        const {
          sendBatchEmails,
          sendBatchSms,
          generateNowLiveEmailHtml,
          generateNowLiveSms,
          isValidEmail,
          isValidPhone,
          formatPhoneNumber,
        } = await import('@/lib/notifications/notificationService');

        // Get user's name for email
        const { data: userData } = await supabase
          .from('users')
          .select('name')
          .eq('id', user.id)
          .single();

        const streamerName = userData?.name || 'Your host';

        // Build viewer URL (use eventId so countdown works)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3009';
        const viewerUrl = `${baseUrl}/watch/${eventId}`;

        // Prepare email list
        const emails = registrations
          .filter(reg => reg.viewer_profiles && isValidEmail(reg.viewer_profiles.email))
          .map(reg => {
            const profile = reg.viewer_profiles;
            return {
              to: profile.email,
              subject: `🔴 LIVE NOW: ${event.title}`,
              html: generateNowLiveEmailHtml({
                eventTitle: event.title,
                streamUrl: viewerUrl,
                streamerName,
                firstName: profile.first_name,
              }),
              tags: ['now-live', 'event-notification'],
              trackOpens: true,
              trackClicks: true,
            };
          });

        // Prepare SMS list
        const smsMessages = registrations
          .filter(reg => reg.viewer_profiles && isValidPhone(reg.viewer_profiles.phone))
          .map(reg => {
            const profile = reg.viewer_profiles;
            return {
              to: formatPhoneNumber(profile.phone),
              body: generateNowLiveSms({
                eventTitle: event.title,
                streamUrl: viewerUrl,
              }),
            };
          });

        console.log(`📧 Sending ${emails.length} emails and ${smsMessages.length} SMS messages...`);

        // Send notifications in parallel
        const [emailResults, smsResults] = await Promise.all([
          emails.length > 0 ? sendBatchEmails(emails, 100, 1000) : Promise.resolve([]),
          smsMessages.length > 0 ? sendBatchSms(smsMessages, 50, 1000) : Promise.resolve([]),
        ]);

        // Count successes and failures
        const emailSuccess = emailResults.filter(r => r.success).length;
        const emailFailed = emailResults.filter(r => !r.success).length;
        const smsSuccess = smsResults.filter(r => r.success).length;
        const smsFailed = smsResults.filter(r => !r.success).length;

        console.log('✅ Notification results:', {
          emails: { sent: emailSuccess, failed: emailFailed },
          sms: { sent: smsSuccess, failed: smsFailed },
        });

        // Update analytics with notification counts
        await supabase
          .from('event_analytics')
          .update({
            notifications_sent: (emailSuccess + smsSuccess),
          })
          .eq('event_id', eventId);

        // Create notification record
        await supabase
          .from('event_notifications')
          .insert({
            event_id: eventId,
            notification_type: 'now_live',
            notification_timing: 'immediate',
            template_name: 'now_live',
            scheduled_time: new Date().toISOString(),
            recipients_count: registrations.length,
            sent_count: emailSuccess + smsSuccess,
            failed_count: emailFailed + smsFailed,
            status: 'sent',
          });

        console.log(`✅ NOW LIVE notifications sent: ${emailSuccess + smsSuccess}/${registrations.length}`);
      } else {
        console.log('ℹ️ No registrants found for this event');
      }
    } catch (notificationError) {
      console.error('❌ Error sending NOW LIVE notifications:', notificationError);
      // Don't fail the API call if notifications fail - event is still live
    }

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
