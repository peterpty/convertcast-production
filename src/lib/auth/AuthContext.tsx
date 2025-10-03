'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// Timeout wrapper for promises
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs / 1000} seconds. Please check your internet connection and try again.`)), timeoutMs)
    ),
  ]);
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    console.log('🔧 AuthContext: Initializing...');

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('❌ AuthContext: Error getting initial session:', error);
      } else {
        console.log('✅ AuthContext: Initial session:', session ? `User: ${session.user.email}` : 'No session');
      }

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 AuthContext: Auth state changed -', event);
      if (session) {
        console.log('👤 AuthContext: User:', session.user.email);
        console.log('⏰ AuthContext: Session expires:', new Date(session.expires_at! * 1000).toLocaleString());
      } else {
        console.log('🚫 AuthContext: No session');
      }

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Redirect to dashboard after sign in (but only from auth pages)
      if (event === 'SIGNED_IN' && session) {
        const currentPath = window.location.pathname;
        const isOnAuthPage = currentPath.startsWith('/auth');
        const isOnDashboard = currentPath.startsWith('/dashboard');
        const isOnWatchPage = currentPath.startsWith('/watch');

        // Only redirect if on auth page (not already on dashboard or watch page)
        if (isOnAuthPage) {
          console.log('🎯 AuthContext: Redirecting to dashboard from auth page...');
          router.push('/dashboard');
        } else {
          console.log('🎯 AuthContext: SIGNED_IN event received, but staying on current page:', currentPath);
        }
      }

      // Redirect to login after sign out
      if (event === 'SIGNED_OUT') {
        console.log('🚪 AuthContext: Redirecting to login...');
        router.push('/auth/login');
      }
    });

    return () => {
      console.log('🔧 AuthContext: Cleaning up subscription');
      subscription.unsubscribe();
    };
  }, [router]);

  const signInWithGoogle = async () => {
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      console.log('🔐 AuthContext: Initiating Google OAuth...');
      console.log('🔗 AuthContext: Redirect URL:', redirectUrl);
      console.log('🔒 AuthContext: Flow Type: PKCE (configured in client)');

      const { data, error } = await withTimeout(
        supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: false,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            }
          },
        }),
        10000, // 10 second timeout
        'Google sign in'
      );

      if (error) {
        console.error('❌ AuthContext: OAuth error:', error);
        throw error;
      }

      console.log('✅ AuthContext: OAuth initiated successfully');
      if (data.url) {
        console.log('🔗 AuthContext: Redirecting to:', data.url.substring(0, 100) + '...');
        // Log if the URL contains any flow indicators
        if (data.url.includes('flow_type')) {
          console.log('📋 AuthContext: Flow type parameter found in URL');
        }
      }
    } catch (error) {
      console.error('❌ AuthContext: Sign in error:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      console.log('🔐 AuthContext: Signing in with email...');

      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({
          email,
          password,
        }),
        10000, // 10 second timeout
        'Email sign in'
      );

      if (error) {
        console.error('❌ AuthContext: Email sign in error:', error);
        throw error;
      }

      console.log('✅ AuthContext: Email sign in successful');
      console.log('👤 AuthContext: User:', data.user.email);
    } catch (error) {
      console.error('❌ AuthContext: Sign in error:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      console.log('🔐 AuthContext: Signing up with email...');

      const { data, error } = await withTimeout(
        supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          }
        }),
        10000, // 10 second timeout
        'Email sign up'
      );

      if (error) {
        console.error('❌ AuthContext: Email sign up error:', error);
        throw error;
      }

      console.log('✅ AuthContext: Email sign up successful');
      if (data.user) {
        console.log('👤 AuthContext: User created:', data.user.email);
        if (data.user.identities && data.user.identities.length === 0) {
          console.log('⚠️ AuthContext: Email already registered');
          throw new Error('This email is already registered. Please sign in instead.');
        }
      }
    } catch (error) {
      console.error('❌ AuthContext: Sign up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
