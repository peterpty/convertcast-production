import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { getConfirmationEmail, getConfirmationSMS } from '@/lib/notifications/templates';
import { sendEmail, sendSms } from '@/lib/notifications/notificationService';
import crypto from 'crypto';

/**
 * POST /api/events/[id]/register
 * Register a viewer for an event
 * Creates viewer_profile and registration, sends confirmation
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await context.params;

    // Use service role key for server-side operations
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Parse request body
    const body = await request.json();
    const {
      email,
      first_name,
      last_name,
      phone,
      company,
      timezone,
      source = 'email',
      send_confirmation = true,
    } = body;

    // Validation
    if (!email || !first_name || !last_name) {
      return NextResponse.json(
        { success: false, error: 'Email, first name, and last name are required' },
        { status: 400 }
      );
    }

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select(`
        *,
        users!events_user_id_fkey (
          name,
          email,
          company
        )
      `)
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      console.error('❌ Event not found:', eventError);
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if event is open for registration
    if (!event.registration_enabled) {
      return NextResponse.json(
        { success: false, error: 'Registration is not enabled for this event' },
        { status: 400 }
      );
    }

    // Check if event is in the past
    if (new Date(event.scheduled_start) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Cannot register for past events' },
        { status: 400 }
      );
    }

    // Check if max registrations reached
    if (event.max_registrations) {
      const { count } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId);

      if (count !== null && count >= event.max_registrations) {
        return NextResponse.json(
          { success: false, error: 'Event is full' },
          { status: 400 }
        );
      }
    }

    console.log('📝 Registering viewer:', email, 'for event:', event.title);

    // Check if viewer profile exists
    let viewerProfile;
    const { data: existingProfile } = await supabase
      .from('viewer_profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (existingProfile) {
      // Update existing profile
      const { data: updated, error: updateError } = await supabase
        .from('viewer_profiles')
        .update({
          first_name,
          last_name,
          phone: phone || existingProfile.phone,
          company: company || existingProfile.company,
          timezone: timezone || existingProfile.timezone,
          last_seen_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingProfile.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Failed to update viewer profile:', updateError);
      }
      viewerProfile = updated || existingProfile;
    } else {
      // Create new viewer profile
      const { data: created, error: createError } = await supabase
        .from('viewer_profiles')
        .insert({
          email,
          first_name,
          last_name,
          phone: phone || '',
          company,
          timezone: timezone || 'America/New_York',
          device_info: {},
          behavioral_data: {},
          purchase_history: {},
          engagement_metrics: {},
          intent_score: 0,
          lifetime_value: 0,
          ai_insights: {},
          showup_surge_data: {},
          engagemax_data: {},
          autooffer_data: {},
          total_events_attended: 0,
          total_purchases: 0,
          total_spent: 0,
          first_seen_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Failed to create viewer profile:', createError);
        return NextResponse.json(
          { success: false, error: 'Failed to create viewer profile' },
          { status: 500 }
        );
      }
      viewerProfile = created;
    }

    // Check if already registered
    const { data: existingRegistration } = await supabase
      .from('registrations')
      .select('*')
      .eq('event_id', eventId)
      .eq('viewer_profile_id', viewerProfile!.id)
      .single();

    if (existingRegistration) {
      console.log('✅ Viewer already registered');
      return NextResponse.json(
        {
          success: true,
          message: 'You are already registered for this event',
          registration: existingRegistration,
          access_token: existingRegistration.access_token,
        },
        { status: 200 }
      );
    }

    // Generate access token
    const accessToken = crypto.randomBytes(32).toString('hex');

    // Create registration
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .insert({
        event_id: eventId,
        viewer_profile_id: viewerProfile!.id,
        access_token: accessToken,
        source,
        registration_data: {
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          user_agent: request.headers.get('user-agent'),
          referrer: request.headers.get('referer'),
        },
        registered_at: new Date().toISOString(),
        attended: false,
        attendance_duration: 0,
        showup_surge_sequence: { stage: 1, notifications_sent: 0 },
      })
      .select()
      .single();

    if (regError) {
      console.error('❌ Failed to create registration:', regError);
      return NextResponse.json(
        { success: false, error: 'Failed to register for event' },
        { status: 500 }
      );
    }

    console.log('✅ Registration created:', registration.id);

    // Update event analytics
    const { data: analytics } = await supabase
      .from('event_analytics')
      .select('*')
      .eq('event_id', eventId)
      .single();

    if (analytics) {
      await supabase
        .from('event_analytics')
        .update({
          total_registrations: (analytics.total_registrations || 0) + 1,
          email_registrations: source === 'email' ? (analytics.email_registrations || 0) + 1 : analytics.email_registrations,
          sms_registrations: source === 'sms' ? (analytics.sms_registrations || 0) + 1 : analytics.sms_registrations,
          social_registrations: source === 'social' ? (analytics.social_registrations || 0) + 1 : analytics.social_registrations,
          updated_at: new Date().toISOString(),
        })
        .eq('event_id', eventId);
    } else {
      // Create analytics record
      await supabase
        .from('event_analytics')
        .insert({
          event_id: eventId,
          total_registrations: 1,
          email_registrations: source === 'email' ? 1 : 0,
          sms_registrations: source === 'sms' ? 1 : 0,
          social_registrations: source === 'social' ? 1 : 0,
        });
    }

    // Send confirmation notification
    if (send_confirmation) {
      const eventDateTime = new Date(event.scheduled_start).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      });

      const eventDate = new Date(event.scheduled_start).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

      const eventTime = new Date(event.scheduled_start).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      });

      const watchUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/watch/${eventId}?token=${accessToken}`;
      const registrationUrl = event.registration_url || `${process.env.NEXT_PUBLIC_APP_URL}/register/${eventId}`;

      const templateVars = {
        firstName: first_name,
        lastName: last_name,
        eventTitle: event.title,
        eventDescription: event.description || '',
        eventDateTime,
        eventDate,
        eventTime,
        timeUntilEvent: 'soon',
        streamerName: (event.users as any)?.name || 'Your Host',
        streamerCompany: (event.users as any)?.company,
        registrationUrl,
        watchUrl,
        unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?token=${accessToken}`,
      };

      // Send email confirmation
      const notificationSettings = (event.notification_settings as any) || {};
      if (notificationSettings.email_enabled !== false) {
        const emailTemplate = getConfirmationEmail(templateVars);
        await sendEmail({
          to: email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text,
          tags: ['event-confirmation', eventId],
          trackOpens: true,
          trackClicks: true,
        });
        console.log('📧 Confirmation email sent to:', email);
      }

      // Send SMS confirmation (if phone provided and SMS enabled)
      if (phone && notificationSettings.sms_enabled) {
        const smsText = getConfirmationSMS(templateVars);
        await sendSms({
          to: phone,
          body: smsText,
        });
        console.log('📱 Confirmation SMS sent to:', phone);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Successfully registered for event',
        registration: {
          id: registration.id,
          event_id: eventId,
          access_token: accessToken,
        },
        event: {
          id: event.id,
          title: event.title,
          scheduled_start: event.scheduled_start,
        },
        watch_url: `${process.env.NEXT_PUBLIC_APP_URL}/watch/${eventId}?token=${accessToken}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error registering for event:', error);
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
 * GET /api/events/[id]/register
 * Get event details for registration page
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await context.params;

    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: event, error } = await supabase
      .from('events')
      .select(`
        *,
        users!events_user_id_fkey (
          name,
          email,
          company,
          avatar_url
        )
      `)
      .eq('id', eventId)
      .single();

    if (error || !event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    // Get registration count
    const { count } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId);

    return NextResponse.json(
      {
        success: true,
        event: {
          id: event.id,
          title: event.title,
          description: event.description,
          scheduled_start: event.scheduled_start,
          scheduled_end: event.scheduled_end,
          timezone: event.timezone,
          status: event.status,
          registration_enabled: event.registration_enabled,
          max_registrations: event.max_registrations,
          current_registrations: count || 0,
          spots_remaining: event.max_registrations ? event.max_registrations - (count || 0) : null,
          host: event.users,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error fetching event:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
