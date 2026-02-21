
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Fix for ESM/CJS compatibility in ts
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const USERS = [
    'user_38yrMcEobW7T7WIsNPJBRgDOfoy', // The main user from logs
];

async function run() {
    console.log("Supabase URL:", supabaseUrl);

    // 1. Fetch ALL users from Profiles first if possible
    const { data: profiles } = await supabase.from('profiles').select('id, username');
    const targetUsers = profiles?.length ? profiles.map(p => p.id) : USERS;

    console.log(`\nAttempting to seed streaks for ${targetUsers.length} users...`);

    for (const uid of targetUsers) {
        console.log(`\nUser: ${uid}`);

        // 2. Insert Past Login History (Last 4 days)
        const historyData = [];
        for (let i = 1; i <= 4; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            historyData.push({
                user_id: uid,
                login_date: d.toISOString().split('T')[0]
            });
        }

        // Try insert directly
        const { error: histError } = await supabase
            .from('login_history')
            .upsert(historyData, { onConflict: 'user_id, login_date', ignoreDuplicates: true });

        if (histError) {
            console.error(`❌ Failed to insert login_history: ${histError.message}`);
            console.log("   (This is expected if RLS policies block inserts. You MUST run the SQL in Dashboard.)");
        } else {
            console.log("✅ Seeded login_history.");
        }

        // 3. Update Profile Streak directly
        const { error: profError } = await supabase
            .from('profiles')
            .update({ streak: 5, longest_streak: 5 })
            .eq('id', uid);

        if (profError) {
            console.error(`❌ Failed to update Profile: ${profError.message}`);
        } else {
            console.log("✅ Updated Profile Streak to 5.");
        }
    }
}

run();
