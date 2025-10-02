'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if we have a session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          router.push('/auth/login?error=callback_failed');
          return;
        }

        if (session) {
          // Redirect to dashboard if authenticated
          router.push('/dashboard');
        } else {
          // No session, redirect to login
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Callback handling error:', error);
        router.push('/auth/login?error=unexpected');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
          Completing sign in...
        </h2>
        <p className="text-purple-200/60 mt-4">
          You'll be redirected shortly
        </p>
      </div>
    </div>
  );
}
