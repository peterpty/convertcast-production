/**
 * Integration Contacts API Route
 * GET /api/integrations/[id]/contacts - Get contacts from integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/integrations/[id]/contacts
 * Get synced contacts for an integration
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: integrationId } = await context.params;

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const listId = searchParams.get('listId');
    const tag = searchParams.get('tag');

    // Verify integration belongs to user
    const { data: integration, error: integrationError } = await supabase
      .from('user_integrations')
      .select('id')
      .eq('id', integrationId)
      .eq('user_id', user.id)
      .single();

    if (integrationError || !integration) {
      return NextResponse.json(
        { success: false, error: 'Integration not found' },
        { status: 404 }
      );
    }

    // Build query
    let query = supabase
      .from('integration_contacts')
      .select('*', { count: 'exact' })
      .eq('integration_id', integrationId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(
        `email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`
      );
    }

    if (tag) {
      query = query.contains('tags', [tag]);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: contacts, error: contactsError, count } = await query;

    if (contactsError) {
      console.error('Failed to fetch contacts:', contactsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch contacts' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      contacts: contacts || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
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
