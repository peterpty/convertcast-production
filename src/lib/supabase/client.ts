import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Default values for development/mock mode
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vY2stcHJvamVjdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQ2NjE2MDAwLCJleHAiOjE5NjIxOTIwMDB9.mock-key-for-development';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vY2stcHJvamVjdCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDY2MTYwMDAsImV4cCI6MTk2MjE5MjAwMH0.mock-service-role-key';

// Mock mode detection
const isMockMode = process.env.MOCK_DATABASE === 'true' || process.env.NODE_ENV === 'development';

// Create mock client that doesn't actually connect to Supabase
function createMockClient() {
  return {
    from: (table: string) => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: null }),
      update: () => ({ data: null, error: null }),
      delete: () => ({ data: null, error: null }),
      upsert: () => ({ data: null, error: null })
    }),
    auth: {
      getUser: () => ({ data: { user: null }, error: null }),
      signIn: () => ({ data: null, error: null }),
      signOut: () => ({ data: null, error: null })
    }
  } as any;
}

export const supabase = isMockMode && (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('mock'))
  ? createMockClient()
  : createClient<Database>(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations
export const supabaseAdmin = isMockMode && (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('mock'))
  ? createMockClient()
  : createClient<Database>(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        }
      }
    );