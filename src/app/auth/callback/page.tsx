'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the OAuth code from URL
        const code = searchParams.get('code');
        const error_code = searchParams.get('error');
        const error_description = searchParams.get('error_description');

        console.log('🔐 OAuth Callback - Code present:', !!code);
        console.log('🔐 OAuth Callback - Error:', error_code, error_description);

        // Check for OAuth errors
        if (error_code) {
          console.error('OAuth error:', error_code, error_description);
          setError(error_description || 'Authentication failed. Please try again.');
          setTimeout(() => router.push('/auth/login'), 3000);
          return;
        }

        // If we have a code, exchange it for a session
        if (code) {
          console.log('🔐 Exchanging code for session...');

          // The auth helpers should automatically handle this via the middleware
          // But we need to wait for the session to be established
          let attempts = 0;
          const maxAttempts = 10;

          while (attempts < maxAttempts) {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError) {
              console.error('Session fetch error:', sessionError);
              attempts++;
              await new Promise(resolve => setTimeout(resolve, 500));
              continue;
            }

            if (session) {
              console.log('✅ Session established successfully');
              console.log('👤 User:', session.user.email);
              // Wait for auth context to update before redirecting
              await new Promise(resolve => setTimeout(resolve, 1000));
              router.push('/dashboard');
              return;
            }

            console.log(`⏳ Waiting for session... (attempt ${attempts + 1}/${maxAttempts})`);
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 500));
          }

          // If we get here, session wasn't established
          console.error('❌ Session not established after', maxAttempts, 'attempts');
          setError('Session could not be established. Please try logging in again.');
          setTimeout(() => router.push('/auth/login'), 2000);
        } else {
          // No code parameter - check if we already have a session
          const { data: { session } } = await supabase.auth.getSession();

          if (session) {
            console.log('✅ Existing session found, redirecting to dashboard');
            router.push('/dashboard');
          } else {
            console.log('❌ No code and no session, redirecting to login');
            setTimeout(() => router.push('/auth/login'), 1000);
          }
        }
      } catch (error) {
        console.error('❌ Callback handling error:', error);
        setError('An unexpected error occurred.');
        setTimeout(() => router.push('/auth/login'), 2000);
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <>
            <div className="w-16 h-16 bg-red-500/20 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl text-red-400">✕</span>
            </div>
            <h2 className="text-2xl font-bold text-red-400 mb-4">
              {error}
            </h2>
            <p className="text-purple-200/60">
              Redirecting back to login...
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
              Completing sign in...
            </h2>
            <p className="text-purple-200/60 mt-4">
              You'll be redirected shortly
            </p>
          </>
        )}
      </div>
    </div>
  );
}
