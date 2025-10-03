import { NextResponse } from 'next/server';

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    environment: {
      node_env: process.env.NODE_ENV || 'not set',
      supabase_url_configured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabase_anon_key_configured: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabase_service_key_configured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      mux_configured: !!process.env.MUX_TOKEN_ID && !!process.env.MUX_TOKEN_SECRET,
    },
    issues: [] as string[],
  };

  // Check for missing critical environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    checks.status = 'unhealthy';
    checks.issues.push('NEXT_PUBLIC_SUPABASE_URL is not set');
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    checks.status = 'unhealthy';
    checks.issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    checks.status = 'warning';
    checks.issues.push('SUPABASE_SERVICE_ROLE_KEY is not set (required for admin operations)');
  }

  if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
    checks.status = 'warning';
    checks.issues.push('Mux credentials not fully configured');
  }

  const statusCode = checks.status === 'healthy' ? 200 : checks.status === 'warning' ? 200 : 503;

  return NextResponse.json(checks, { status: statusCode });
}
