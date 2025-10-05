/**
 * Individual Integration API Routes
 * GET    /api/integrations/[id] - Get integration details
 * PATCH  /api/integrations/[id] - Update integration
 * DELETE /api/integrations/[id] - Delete integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import { encryptFields } from '@/lib/security/encryption';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/integrations/[id]
 * Get integration details
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

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
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch integration
    const { data: integration, error } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !integration) {
      return NextResponse.json(
        { success: false, error: 'Integration not found' },
        { status: 404 }
      );
    }

    // Sanitize (remove encrypted fields)
    const sanitized = {
      ...integration,
      api_key_encrypted: undefined,
      api_secret_encrypted: undefined,
      oauth_token_encrypted: undefined,
    };

    return NextResponse.json({
      success: true,
      integration: sanitized,
    });
  } catch (error) {
    console.error('Error fetching integration:', error);
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
 * PATCH /api/integrations/[id]
 * Update integration
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
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
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      service_name,
      is_active,
      is_primary,
      credentials,
      configuration,
      sender_email,
      sender_phone,
    } = body;

    console.log('🔄 Updating integration:', { id, user: user.email });

    // Build update object
    const updates: any = {};

    if (service_name !== undefined) updates.service_name = service_name;
    if (is_active !== undefined) updates.is_active = is_active;
    if (configuration !== undefined) updates.configuration = configuration;
    if (sender_email !== undefined) updates.sender_email = sender_email;
    if (sender_phone !== undefined) updates.sender_phone = sender_phone;

    // Handle credentials update (if provided)
    if (credentials) {
      const encryptedCredentials = encryptFields({
        api_key: credentials.apiKey,
        api_secret: credentials.apiSecret,
        oauth_token: credentials.oauthToken,
      });

      if (encryptedCredentials.api_key) updates.api_key_encrypted = encryptedCredentials.api_key;
      if (encryptedCredentials.api_secret) updates.api_secret_encrypted = encryptedCredentials.api_secret;
      if (encryptedCredentials.oauth_token) updates.oauth_token_encrypted = encryptedCredentials.oauth_token;
    }

    // Handle primary flag
    if (is_primary) {
      // Get integration service type first
      const { data: existing } = await supabase
        .from('user_integrations')
        .select('service_type')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        // Unset other primary integrations of same type
        await supabase
          .from('user_integrations')
          .update({ is_primary: false })
          .eq('user_id', user.id)
          .eq('service_type', existing.service_type)
          .neq('id', id);

        updates.is_primary = true;
      }
    } else if (is_primary === false) {
      updates.is_primary = false;
    }

    updates.updated_at = new Date().toISOString();

    // Update integration
    const { data: integration, error: updateError } = await supabase
      .from('user_integrations')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError || !integration) {
      console.error('❌ Failed to update integration:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update integration',
          details: updateError?.message,
        },
        { status: 500 }
      );
    }

    console.log('✅ Integration updated:', integration.id);

    // Sanitize response
    const sanitized = {
      ...integration,
      api_key_encrypted: undefined,
      api_secret_encrypted: undefined,
      oauth_token_encrypted: undefined,
    };

    return NextResponse.json({
      success: true,
      integration: sanitized,
      message: 'Integration updated successfully',
    });
  } catch (error) {
    console.error('❌ Error updating integration:', error);
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
 * DELETE /api/integrations/[id]
 * Delete integration
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

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
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🗑️ Deleting integration:', { id, user: user.email });

    // Delete integration (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('user_integrations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('❌ Failed to delete integration:', deleteError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete integration',
          details: deleteError.message,
        },
        { status: 500 }
      );
    }

    console.log('✅ Integration deleted:', id);

    return NextResponse.json({
      success: true,
      message: 'Integration deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting integration:', error);
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
