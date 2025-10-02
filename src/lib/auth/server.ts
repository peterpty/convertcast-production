import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';

export async function getServerSession() {
  const supabase = createServerComponentClient<Database>({ cookies });

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session;
  } catch (error) {
    console.error('Error getting server session:', error);
    return null;
  }
}

export async function getServerUser() {
  const supabase = createServerComponentClient<Database>({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user;
  } catch (error) {
    console.error('Error getting server user:', error);
    return null;
  }
}

export async function requireAuth() {
  const session = await getServerSession();

  if (!session) {
    return {
      isAuthenticated: false,
      session: null,
      user: null,
    };
  }

  return {
    isAuthenticated: true,
    session,
    user: session.user,
  };
}
