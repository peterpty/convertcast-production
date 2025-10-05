/**
 * Integration Management API Routes
 * GET  /api/integrations - List user's integrations
 * POST /api/integrations - Create new integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import { encrypt, encryptFields } from '@/lib/security/encryption';
import { integrationFactory } from '@/lib/integrations/factory';

/**
 * GET /api/integrations
 * List all integrations for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
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

    // Fetch user's integrations
    const { data: integrations, error } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch integrations:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch integrations' },
        { status: 500 }
      );
    }

    // Remove encrypted fields from response (for security)
    const sanitizedIntegrations = integrations?.map(integration => ({
      ...integration,
      api_key_encrypted: undefined,
      api_secret_encrypted: undefined,
      oauth_token_encrypted: undefined,
    })) || [];

    return NextResponse.json({
      success: true,
      integrations: sanitizedIntegrations,
    });
  } catch (error) {
    console.error('Error fetching integrations:', error);
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
 * POST /api/integrations
 * Create a new integration
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
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      service_type,
      service_name,
      credentials,
      configuration,
      is_primary,
      sender_email,
      sender_phone,
    } = body;

    // Validation
    if (!service_type || !service_name || !credentials) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('📝 Creating integration:', { service_type, service_name, user: user.email });

    // Test the integration before saving
    try {
      const adapter = integrationFactory.create(service_type, credentials, configuration);

      // Validate credentials format
      const validation = adapter.validateCredentials();
      if (!validation.valid) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid credentials',
            details: validation.errors,
          },
          { status: 400 }
        );
      }

      // Test connection
      const healthCheck = await adapter.verifyConnection();
      if (!healthCheck.healthy) {
        return NextResponse.json(
          {
            success: false,
            error: 'Connection test failed',
            details: healthCheck.error,
          },
          { status: 400 }
        );
      }

      console.log('✅ Integration connection verified');
    } catch (error) {
      console.error('❌ Integration test failed:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to verify integration',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 400 }
      );
    }

    // Encrypt sensitive credentials
    const encryptedCredentials = encryptFields({
      api_key: credentials.apiKey,
      api_secret: credentials.apiSecret,
      oauth_token: credentials.oauthToken,
    });

    // Get adapter capabilities
    const adapter = integrationFactory.create(service_type, credentials, configuration);
    const capabilities = adapter.getCapabilities();

    // If setting as primary, unset other primary integrations of same type
    if (is_primary) {
      await supabase
        .from('user_integrations')
        .update({ is_primary: false })
        .eq('user_id', user.id)
        .eq('service_type', service_type);
    }

    // Insert into database
    const { data: integration, error: insertError } = await supabase
      .from('user_integrations')
      .insert({
        user_id: user.id,
        service_type,
        service_name,
        api_key_encrypted: encryptedCredentials.api_key,
        api_secret_encrypted: encryptedCredentials.api_secret,
        oauth_token_encrypted: encryptedCredentials.oauth_token,
        sender_email: sender_email || credentials.senderEmail || null,
        sender_phone: sender_phone || credentials.senderPhone || null,
        configuration: configuration || {},
        capabilities,
        status: 'verified',
        is_active: true,
        is_primary: is_primary || false,
        verified_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError || !integration) {
      console.error('❌ Failed to create integration:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create integration',
          details: insertError?.message,
        },
        { status: 500 }
      );
    }

    console.log('✅ Integration created:', integration.id);

    // Sanitize response (remove encrypted fields)
    const sanitized = {
      ...integration,
      api_key_encrypted: undefined,
      api_secret_encrypted: undefined,
      oauth_token_encrypted: undefined,
    };

    return NextResponse.json(
      {
        success: true,
        integration: sanitized,
        message: 'Integration created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating integration:', error);
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
