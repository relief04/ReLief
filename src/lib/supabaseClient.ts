import { createClient } from '@supabase/supabase-js';

// Helper to get the actual client, allowing for lazy initialization
let supabaseInstance: any = null;

export const supabase = new Proxy({} as any, {
    get: (target, prop) => {
        if (!supabaseInstance) {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            if (!supabaseUrl || !supabaseKey) {
                // During build, we return a dummy object to prevent crashes
                if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
                    console.warn('Supabase keys missing during build. Returning dummy client.');
                    return () => ({});
                }
                throw new Error('Supabase environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.');
            }
            supabaseInstance = createClient(supabaseUrl, supabaseKey);
        }
        return (supabaseInstance as any)[prop];
    }
});
