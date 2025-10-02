import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Explicit mock mode detection - only use mock if explicitly enabled OR no URL provided
const isMockMode = process.env.MOCK_DATABASE === 'true' ||
                  !supabaseUrl ||
                  supabaseUrl.includes('mock');

console.log('🔧 Supabase Client Config:', {
  hasUrl: !!supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  isMockMode,
  url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'none'
});

// Create mock client that doesn't actually connect to Supabase
function createMockClient() {
  console.warn('⚠️ Using MOCK Supabase client - auth will not work!');
  return {
    from: (table: string) => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: null }),
      update: () => ({ data: null, error: null }),
      delete: () => ({ data: null, error: null }),
      upsert: () => ({ data: null, error: null })
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithOAuth: () => Promise.resolve({ data: { url: null, provider: 'google' }, error: new Error('Mock mode: OAuth not available') }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    }
  } as any;
}

// Create real Supabase client with proper cookie options for production
export const supabase = isMockMode
  ? createMockClient()
  : createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      }
    });

// Admin client for server-side operations
// Only create if service key is available (server-side only)
export const supabaseAdmin = isMockMode
  ? createMockClient()
  : (supabaseServiceKey && typeof window === 'undefined')
    ? createClient<Database>(
        supabaseUrl,
        supabaseServiceKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          }
        }
      )
    : createMockClient(); // Use mock on client side

// Log the client type for debugging
if (typeof window !== 'undefined') {
  console.log('✅ Supabase client initialized:', isMockMode ? 'MOCK MODE' : 'PRODUCTION MODE');
}