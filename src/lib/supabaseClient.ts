import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Only attempt to create the client if we have real values or if we're in development
export const supabase = createClient(supabaseUrl, supabaseKey);

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (process.env.NODE_ENV === 'production') {
        console.warn('Supabase environment variables are missing. This is expected during some build phases but will cause runtime errors if not configured in Vercel.');
    }
}
