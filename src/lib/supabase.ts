import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.error(
    '[QT CRM] Missing Supabase environment variables.\n' +
    'Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your deployment environment (Netlify → Site settings → Environment variables), then trigger a new deploy.'
  );
}

export const supabase = createClient(supabaseUrl ?? 'http://localhost:5173', supabaseAnonKey ?? '');
