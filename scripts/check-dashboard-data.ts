
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const USER_ID = 'user_2t18lLZgZmqZ92d8y0N9k2n9J8L'; // Example Clerk User ID from previous logs if possible, but I don't have it explicitly.
// Wait, I saw 'user_38yrMcEobW7T7WIsNPJBRgDOfoy' in `sync_profile_streak.sql`. Let's use that.
// BUT, I should check `profiles` first to see ALL users.

async function run() {
    console.log("Supabase URL:", supabaseUrl);

    // 1. List all profiles (LIMIT 5)
    const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('*')
        .limit(5);

    if (pErr) console.error("Profile Error:", pErr);
    else {
        console.log(`Found ${profiles?.length} profiles.`);
        profiles?.forEach(p => console.log(`- ${p.id} (${p.username}): Streak=${p.streak}, Total=${p.carbon_total}`));
    }

    if (!profiles || profiles.length === 0) {
        console.log("No profiles found. Cannot proceed.");
        return;
    }

    const userId = profiles[0].id; // Use first found user
    console.log(`\nDebugging for User: ${userId}`);

    // 2. Check Activities
    const { data: acts, error: aErr } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', userId)
        .limit(5);

    if (aErr) console.error("Activities Error:", aErr);
    else console.log(`Activities found: ${acts?.length}`);

    // 3. User Emissions Summary (View)
    const { data: view, error: vErr } = await supabase
        .from('user_emissions_summary')
        .select('*')
        .limit(5); // Don't filter by user yet, see if ANYTHING returns

    if (vErr) console.error("View Error:", vErr);
    else {
        console.log(`View entries found (global): ${view?.length}`);
        const userView = view?.filter((v: any) => v.user_id === userId);
        console.log(`View entries for user: ${userView?.length}`);
    }

    // 4. Login History
    const { data: history, error: hErr } = await supabase
        .from('login_history')
        .select('*')
        .eq('user_id', userId);

    if (hErr) console.error("Login History Error:", hErr);
    else {
        console.log(`Login History count: ${history?.length}`);
        console.log(history);
    }
}

run();
