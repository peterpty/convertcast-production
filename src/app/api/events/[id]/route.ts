import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';

/**
 * PATCH /api/events/[id]
 * Update an event (status, title, description, etc.)
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await context.params;
    const body = await request.json();

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
            response.cookies.set({ name, value, ...options });
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

    console.log('📝 Updating event:', eventId, 'with data:', body);

    // Update event (RLS ensures user can only update their own events)
    const { data: event, error: updateError } = await supabase
      .from('events')
      .update(body)
      .eq('id', eventId)
      .eq('user_id', user.id) // Ensure user owns this event
      .select()
      .single();

    if (updateError) {
      console.error('❌ Failed to update event:', updateError);

      // Check if event doesn't exist or user doesn't own it
      if (updateError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Event not found or access denied' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update event',
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found or access denied' },
        { status: 404 }
      );
    }

    console.log('✅ Event updated successfully');

    return NextResponse.json(
      {
        success: true,
        message: 'Event updated successfully',
        event,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error updating event:', error);
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
 * DELETE /api/events/[id]
 * Delete an event
 */
export async function DELETE(
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

    console.log('🗑️ Deleting event:', eventId);

    // Delete event (RLS ensures user can only delete their own events)
    // Cascade delete will handle related records (registrations, analytics, etc.)
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)
      .eq('user_id', user.id); // Ensure user owns this event

    if (deleteError) {
      console.error('❌ Failed to delete event:', deleteError);

      // Check if event doesn't exist or user doesn't own it
      if (deleteError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Event not found or access denied' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete event',
          details: deleteError.message,
        },
        { status: 500 }
      );
    }

    console.log('✅ Event deleted successfully');

    return NextResponse.json(
      {
        success: true,
        message: 'Event deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error deleting event:', error);
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
