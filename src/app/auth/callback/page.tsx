'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      const logs: string[] = [];

      const addLog = (msg: string) => {
        console.log(msg);
        logs.push(msg);
        setDebugLogs([...logs]);
      };

      try {
        addLog('═══════════════════════════════════');
        addLog('🔐 AUTH CALLBACK HANDLER STARTED');
        addLog('═══════════════════════════════════');

        // Get full URL details
        const fullUrl = window.location.href;
        const hash = window.location.hash;
        const search = window.location.search;

        addLog(`📍 Full URL: ${fullUrl}`);
        addLog(`📍 Hash: ${hash || 'none'}`);
        addLog(`📍 Search: ${search || 'none'}`);

        // Check for access_token in hash (implicit flow)
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        addLog(`🔑 Access token in hash: ${accessToken ? 'YES' : 'NO'}`);
        addLog(`🔑 Refresh token in hash: ${refreshToken ? 'YES' : 'NO'}`);

        // Check for code in search params (PKCE flow)
        const searchParams = new URLSearchParams(search);
        const code = searchParams.get('code');
        const errorCode = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        addLog(`🔑 Code in params: ${code ? 'YES' : 'NO'}`);
        addLog(`❌ Error in params: ${errorCode || 'none'}`);

        // Handle OAuth errors
        if (errorCode) {
          addLog(`❌ OAuth error: ${errorCode} - ${errorDescription}`);
          setError(errorDescription || 'Authentication failed');
          setTimeout(() => router.push('/auth/login'), 3000);
          return;
        }

        // If we have a hash with tokens (implicit flow - fallback)
        if (accessToken) {
          addLog('⚠️ WARNING: Using implicit flow (hash-based tokens)');
          addLog('⚠️ This means PKCE flow is NOT working properly');
          addLog('🔧 Attempting to handle session from hash...');

          // Let Supabase's detectSessionInUrl handle it
          await new Promise(resolve => setTimeout(resolve, 2000));

          const { data: { session }, error: sessionError } = await supabase.auth.getSession();

          if (sessionError) {
            addLog(`❌ Session error: ${sessionError.message}`);
            setError('Failed to establish session');
            setTimeout(() => router.push('/auth/login'), 2000);
            return;
          }

          if (session) {
            addLog(`✅ Session established via implicit flow`);
            addLog(`👤 User: ${session.user.email}`);
            addLog(`🎯 Redirecting to dashboard...`);

            // Wait for auth context to update
            await new Promise(resolve => setTimeout(resolve, 1000));
            router.push('/dashboard');
            return;
          } else {
            addLog('❌ No session after implicit flow handling');
            setError('Session not established');
            setTimeout(() => router.push('/auth/login'), 2000);
            return;
          }
        }

        // If we have a code (PKCE flow - preferred)
        if (code) {
          addLog('✅ PKCE flow detected (code in URL)');
          addLog('🔧 Waiting for session establishment...');

          let attempts = 0;
          const maxAttempts = 15; // Increased from 10

          while (attempts < maxAttempts) {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError) {
              addLog(`❌ Session fetch error (attempt ${attempts + 1}): ${sessionError.message}`);
              attempts++;
              await new Promise(resolve => setTimeout(resolve, 500));
              continue;
            }

            if (session) {
              addLog(`✅ Session established successfully!`);
              addLog(`👤 User: ${session.user.email}`);
              addLog(`⏰ Expires: ${new Date(session.expires_at! * 1000).toLocaleString()}`);
              addLog(`🎯 Redirecting to dashboard...`);

              // Wait for auth context to update
              await new Promise(resolve => setTimeout(resolve, 1000));
              router.push('/dashboard');
              return;
            }

            addLog(`⏳ Waiting for session... (attempt ${attempts + 1}/${maxAttempts})`);
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 500));
          }

          // Session not established after all attempts
          addLog(`❌ Session not established after ${maxAttempts} attempts`);
          addLog('💡 This suggests the code exchange failed');
          setError('Session could not be established. Please try again.');
          setShowDebug(true);
          setTimeout(() => router.push('/auth/login'), 5000);
          return;
        }

        // No code or token - check for existing session
        addLog('🔍 No code or token in URL, checking for existing session...');
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          addLog(`✅ Existing session found`);
          addLog(`👤 User: ${session.user.email}`);
          router.push('/dashboard');
        } else {
          addLog('❌ No session found, redirecting to login');
          setTimeout(() => router.push('/auth/login'), 1000);
        }

      } catch (err: any) {
        const errorMsg = `❌ Callback handling error: ${err.message || err}`;
        addLog(errorMsg);
        console.error(err);
        setError('An unexpected error occurred');
        setShowDebug(true);
        setTimeout(() => router.push('/auth/login'), 5000);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          {error ? (
            <>
              <div className="w-16 h-16 bg-red-500/20 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl text-red-400">✕</span>
              </div>
              <h2 className="text-2xl font-bold text-red-400 mb-4">
                {error}
              </h2>
              <p className="text-purple-200/60 mb-4">
                Redirecting back to login...
              </p>
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="text-purple-400 hover:text-purple-300 underline text-sm"
              >
                {showDebug ? 'Hide' : 'Show'} Debug Info
              </button>
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
              {debugLogs.length > 5 && (
                <button
                  onClick={() => setShowDebug(!showDebug)}
                  className="mt-4 text-purple-400 hover:text-purple-300 underline text-sm"
                >
                  {showDebug ? 'Hide' : 'Show'} Debug Info
                </button>
              )}
            </>
          )}
        </div>

        {/* Debug Console */}
        {showDebug && debugLogs.length > 0 && (
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg p-4 border border-slate-700">
            <h3 className="text-white font-bold mb-2 text-sm">Debug Console:</h3>
            <div className="bg-black/50 rounded p-3 max-h-96 overflow-y-auto">
              {debugLogs.map((log, i) => (
                <div key={i} className="text-xs font-mono text-green-400 mb-1">
                  {log}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Check browser console (F12) for full logs
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
