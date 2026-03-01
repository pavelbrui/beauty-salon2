import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

if (!hasSupabaseConfig) {
  console.error(
    'Missing Supabase environment variables. Running in limited mode until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are configured.'
  );
}

const fallbackSupabaseUrl = 'https://placeholder.supabase.co';
const fallbackSupabaseAnonKey = 'placeholder-anon-key';

export const supabase = createClient(
  supabaseUrl ?? fallbackSupabaseUrl,
  supabaseAnonKey ?? fallbackSupabaseAnonKey,
  {
    auth: {
      persistSession: hasSupabaseConfig,
      autoRefreshToken: hasSupabaseConfig,
      detectSessionInUrl: hasSupabaseConfig,
    },
  }
);

export const isSupabaseConfigured = hasSupabaseConfig;

// Helper function to handle Supabase errors (sanitized — never leak DB details to client)
export const handleSupabaseError = (error: any) => {
  if (import.meta.env.DEV) {
    console.error('Supabase error:', error);
  }
  return {
    error: 'An unexpected error occurred. Please try again.',
    details: ''
  };
};