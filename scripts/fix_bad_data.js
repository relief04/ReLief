
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function fixBadData() {
    console.log('🔍 Checking for anomalous activity data...');

    // Find activities with emissions > 100,000
    const { data: badActivities, error: findError } = await supabase
        .from('activities')
        .select('id, user_id, impact, description')
        .gt('impact', 100000);

    if (findError) {
        console.error('Error finding bad data:', findError);
        return;
    }

    if (!badActivities || badActivities.length === 0) {
        console.log('✅ No anomalous data found.');
        return;
    }

    console.log(`⚠️ Found ${badActivities.length} anomalous activities:`);
    badActivities.forEach(a => {
        console.log(` - ID: ${a.id}, User: ${a.user_id}, Impact: ${a.impact}, Desc: ${a.description}`);
    });

    // Delete them
    console.log('🗑️ Deleting anomalous activities...');
    const idsToDelete = badActivities.map(a => a.id);

    const { error: deleteError } = await supabase
        .from('activities')
        .delete()
        .in('id', idsToDelete);

    if (deleteError) {
        console.error('Error deleting data:', deleteError);
    } else {
        console.log('✅ Successfully deleted anomalous activities.');

        // Optional: Recalculate user totals if needed, but for now we just remove the bad data
        // The next time the user loads the dashboard, the profile total might still be high
        // We should probably fix the profile total too.

        for (const activity of badActivities) {
            console.log(`🔄 Updating profile for user ${activity.user_id}...`);

            // Get current profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('carbon_total')
                .eq('id', activity.user_id)
                .single();

            if (profile) {
                const newTotal = Math.max(0, profile.carbon_total - activity.impact);
                await supabase
                    .from('profiles')
                    .update({ carbon_total: newTotal })
                    .eq('id', activity.user_id);

                console.log(`   Updated carbon_total from ${profile.carbon_total} to ${newTotal}`);
            }
        }
    }
}

fixBadData();
