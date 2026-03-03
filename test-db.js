const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const db = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log('Testing tables...');
    const tables = ['profiles', 'posts', 'groups', 'user_badges', 'events', 'success_stories'];
    for (const t of tables) {
        const { data, error, count } = await db.from(t).select('*', { count: 'exact', head: true });
        if (error) {
            console.error(`Error on ${t}:`, error.message);
        } else {
            console.log(`Table ${t} exists. Count: ${count}`);
        }
    }
}

test();
