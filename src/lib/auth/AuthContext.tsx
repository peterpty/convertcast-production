'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
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

      // Redirect to dashboard after sign in
      if (event === 'SIGNED_IN' && session) {
        console.log('🎯 AuthContext: Redirecting to dashboard...');
        router.push('/dashboard');
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

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        },
      });

      if (error) {
        console.error('❌ AuthContext: OAuth error:', error);
        throw error;
      }

      console.log('✅ AuthContext: OAuth initiated successfully');
      if (data.url) {
        console.log('🔗 AuthContext: Redirecting to:', data.url.substring(0, 50) + '...');
      }
    } catch (error) {
      console.error('❌ AuthContext: Sign in error:', error);
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
