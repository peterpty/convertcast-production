'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Exchange the code for a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Auth callback error:', sessionError);
          setError('Authentication failed. Please try again.');
          setTimeout(() => router.push('/auth/login'), 2000);
          return;
        }

        if (session) {
          console.log('🔐 Session established, redirecting to dashboard');
          // Give the auth context time to update
          setTimeout(() => {
            router.push('/dashboard');
          }, 500);
        } else {
          // No session yet, wait for auth state change
          console.log('⏳ Waiting for session...');
          setTimeout(() => {
            router.push('/auth/login');
          }, 2000);
        }
      } catch (error) {
        console.error('Callback handling error:', error);
        setError('An unexpected error occurred.');
        setTimeout(() => router.push('/auth/login'), 2000);
      }
    };

    handleCallback();
  }, [router]);

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
