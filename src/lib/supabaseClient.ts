import { createClient } from '@supabase/supabase-js';

// Read env variables, but provide a tiny fallback to prevent crashes 
// during static build phases if vars are temporarily missing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fallback.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fallback-anon-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.warn('⚠️ NEXT_PUBLIC_SUPABASE_URL is missing. Using fallback for build compatibility.');
}

// Stable singleton — created once and reused
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
