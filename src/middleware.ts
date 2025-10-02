import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Refresh session if expired
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
  const isDashboardPage = req.nextUrl.pathname.startsWith('/dashboard');
  const isPasswordResetPage = req.nextUrl.pathname.startsWith('/auth/reset-password') ||
                               req.nextUrl.pathname.startsWith('/auth/update-password');

  // If trying to access dashboard without auth, redirect to login
  if (isDashboardPage && !session) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  // If trying to access auth pages while already authenticated, redirect to dashboard
  // EXCEPT for callback, reset-password, and update-password pages
  if (isAuthPage && session && !req.nextUrl.pathname.includes('/callback') && !isPasswordResetPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
