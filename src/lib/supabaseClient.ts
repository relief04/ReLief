import { createClient } from '@supabase/supabase-js';

// Helper to get the actual client, allowing for lazy initialization
let supabaseInstance: any = null;

// A "black hole" proxy that absorbs all calls during build-time without crashing
const noopProxy: any = new Proxy(() => noopProxy, {
    get: () => noopProxy
});

export const supabase = new Proxy({} as any, {
    get: (target, prop) => {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        // If keys are missing, we MUST be in build-time or have a config error.
        // We return the noopProxy during server-side build to prevent crashes.
        if (!supabaseUrl || !supabaseKey) {
            if (typeof window === 'undefined') {
                return noopProxy;
            }
            // On client, we still want it to throw if it's a real runtime access without keys
            throw new Error('Supabase environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.');
        }

        if (!supabaseInstance) {
            supabaseInstance = createClient(supabaseUrl, supabaseKey);
        }
        return (supabaseInstance as any)[prop];
    }
});
