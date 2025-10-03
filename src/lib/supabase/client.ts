import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Get environment variables - REQUIRED for production
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = `
╔════════════════════════════════════════════════════════════════╗
║  CRITICAL ERROR: Missing Supabase Configuration                ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  Required environment variables are not set:                   ║
║                                                                ║
${!supabaseUrl ? '║  ❌ NEXT_PUBLIC_SUPABASE_URL                                   ║\n' : ''}${!supabaseAnonKey ? '║  ❌ NEXT_PUBLIC_SUPABASE_ANON_KEY                              ║\n' : ''}║                                                                ║
║  This application requires Supabase to function.               ║
║                                                                ║
║  VERCEL USERS:                                                 ║
║  1. Go to: Settings → Environment Variables                    ║
║  2. Add the missing variables                                  ║
║  3. Redeploy your application                                  ║
║                                                                ║
║  LOCAL DEVELOPMENT:                                            ║
║  1. Copy .env.example to .env.local                            ║
║  2. Add your Supabase credentials                              ║
║  3. Restart your dev server                                    ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
  `;

  console.error(errorMessage);

  if (typeof window !== 'undefined') {
    // Show error in browser console with styling
    console.error('%c⚠️ CONFIGURATION ERROR', 'color: red; font-size: 24px; font-weight: bold;');
    console.error('%cMissing Supabase environment variables. Check console for details.', 'color: red; font-size: 16px;');
  }

  throw new Error('Missing required Supabase environment variables. Check console for details.');
}

console.log('✅ Supabase Configuration:', {
  url: `${supabaseUrl.substring(0, 30)}...`,
  hasAnonKey: true,
  hasServiceKey: !!supabaseServiceKey,
  mode: 'PRODUCTION'
});

// Create Supabase client with production configuration
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
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
export const supabaseAdmin = (supabaseServiceKey && typeof window === 'undefined')
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
  : supabase; // Use regular client on client-side

// Log successful initialization
if (typeof window !== 'undefined') {
  console.log('✅ Supabase client initialized successfully');
}