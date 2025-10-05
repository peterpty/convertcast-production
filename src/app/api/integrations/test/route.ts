/**
 * Integration Testing API Route
 * POST /api/integrations/test - Test integration credentials before saving
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { testIntegration } from '@/lib/integrations/factory';

/**
 * POST /api/integrations/test
 * Test integration credentials without saving to database
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { service_type, credentials, configuration } = body;

    // Validation
    if (!service_type || !credentials) {
      return NextResponse.json(
        { success: false, error: 'service_type and credentials are required' },
        { status: 400 }
      );
    }

    console.log('🧪 Testing integration:', { service_type, user: user.email });

    // Test the integration
    const result = await testIntegration(service_type, credentials, configuration);

    if (result.success) {
      console.log('✅ Integration test passed');
      return NextResponse.json({
        success: true,
        healthy: result.healthy,
        responseTime: result.responseTime,
        metadata: result.metadata,
        message: 'Integration credentials are valid',
      });
    } else {
      console.log('❌ Integration test failed:', result.error);
      return NextResponse.json(
        {
          success: false,
          healthy: result.healthy,
          error: result.error,
          message: 'Integration test failed',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('❌ Error testing integration:', error);
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
