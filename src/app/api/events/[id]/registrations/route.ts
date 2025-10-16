import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import crypto from 'crypto';

/**
 * GET /api/events/[id]/registrations
 * Get all registrations for an event with viewer profile details
 */
export async function GET(
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

    console.log('📋 Fetching registrations for event:', eventId);

    // Verify user owns this event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, user_id')
      .eq('id', eventId)
      .eq('user_id', user.id)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, error: 'Event not found or access denied' },
        { status: 404 }
      );
    }

    // Fetch all registrations with viewer profiles
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select(`
        id,
        created_at,
        registered_at,
        attended,
        attendance_duration,
        access_token,
        source,
        viewer_profile_id,
        viewer_profiles (
          id,
          first_name,
          last_name,
          email,
          phone,
          company,
          total_events_attended,
          first_seen_at,
          last_seen_at
        )
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (regError) {
      console.error('❌ Error fetching registrations:', regError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch registrations' },
        { status: 500 }
      );
    }

    console.log(`✅ Found ${registrations?.length || 0} registrations`);

    return NextResponse.json(
      {
        success: true,
        registrations: registrations || [],
        count: registrations?.length || 0,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error in GET /api/events/[id]/registrations:', error);
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
 * POST /api/events/[id]/registrations
 * Manually add a registration to an event (for bulk imports or retroactive additions)
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await context.params;
    const body = await request.json();

    const { first_name, last_name, email, phone, source = 'manual' } = body;

    // Validate required fields
    if (!first_name || !last_name || !email) {
      return NextResponse.json(
        { success: false, error: 'first_name, last_name, and email are required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

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

    console.log('➕ Adding registration to event:', eventId);

    // Verify user owns this event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, user_id, scheduled_start')
      .eq('id', eventId)
      .eq('user_id', user.id)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, error: 'Event not found or access denied' },
        { status: 404 }
      );
    }

    // Check if viewer profile already exists with this email
    let viewerProfile;
    const { data: existingProfile, error: profileQueryError } = await supabase
      .from('viewer_profiles')
      .select('id, first_name, last_name, email, phone')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existingProfile) {
      console.log('✅ Found existing viewer profile:', existingProfile.id);
      viewerProfile = existingProfile;

      // Update profile with any new information
      const updates: any = {};
      if (phone && !existingProfile.phone) updates.phone = phone;

      if (Object.keys(updates).length > 0) {
        await supabase
          .from('viewer_profiles')
          .update(updates)
          .eq('id', existingProfile.id);
        console.log('✅ Updated viewer profile with new info');
      }
    } else {
      // Create new viewer profile
      console.log('📝 Creating new viewer profile...');
      const { data: newProfile, error: createProfileError } = await supabase
        .from('viewer_profiles')
        .insert({
          first_name,
          last_name,
          email: email.toLowerCase().trim(),
          phone: phone || '',
          first_seen_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createProfileError || !newProfile) {
        console.error('❌ Error creating viewer profile:', createProfileError);
        return NextResponse.json(
          { success: false, error: 'Failed to create viewer profile' },
          { status: 500 }
        );
      }

      viewerProfile = newProfile;
      console.log('✅ Created new viewer profile:', newProfile.id);
    }

    // Check if registration already exists
    const { data: existingReg } = await supabase
      .from('registrations')
      .select('id, access_token')
      .eq('event_id', eventId)
      .eq('viewer_profile_id', viewerProfile.id)
      .single();

    if (existingReg) {
      console.log('ℹ️ Registration already exists for this viewer');
      return NextResponse.json(
        {
          success: true,
          message: 'Registration already exists',
          registration: {
            id: existingReg.id,
            viewer_profile_id: viewerProfile.id,
            access_token: existingReg.access_token,
            viewer_profiles: viewerProfile,
            already_existed: true,
          },
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
        viewer_profile_id: viewerProfile.id,
        access_token: accessToken,
        source,
        registered_at: new Date().toISOString(),
      })
      .select(`
        id,
        created_at,
        registered_at,
        access_token,
        viewer_profile_id
      `)
      .single();

    if (regError || !registration) {
      console.error('❌ Error creating registration:', regError);
      return NextResponse.json(
        { success: false, error: 'Failed to create registration' },
        { status: 500 }
      );
    }

    console.log('✅ Registration created:', registration.id);

    // Generate watch URL with access token
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3009';
    const watchUrl = `${baseUrl}/watch/${eventId}?token=${accessToken}`;

    return NextResponse.json(
      {
        success: true,
        message: 'Registration created successfully',
        registration: {
          ...registration,
          viewer_profiles: viewerProfile,
          watch_url: watchUrl,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error in POST /api/events/[id]/registrations:', error);
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
