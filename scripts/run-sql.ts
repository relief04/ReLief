import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(url, serviceKey);

async function run() {
    try {
        console.log("Running SQL to add columns to profiles...");
        const { data, error } = await supabase.rpc('execute_sql', {
            query: `
                ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;
                ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
            `
        });

        if (error) {
            console.error("RPC failed, this means RPC execute_sql is not defined. We might need to use the Supabase dashboard directly.", error);
        } else {
            console.log("Success:", data);
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

run();
