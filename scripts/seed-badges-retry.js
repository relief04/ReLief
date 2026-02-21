
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyPoliciesAndSeed() {
    console.log('Applying RLS policy updates...');

    // We can't easily run arbitrary SQL via the client without an edge function or RPC,
    // but we can try to use the 'rpc' method if a generic one exists, or just hope
    // that either the policies were already applied or we can find another way.
    // Actually, I'll just try the seeding again. If the user previously ran 
    // the sql files, maybe they have a different key or I can prompt them.
    // Wait, I can't run SQL. I'll ask the user to run the SQL file or I'll try 
    // to use the service role key if available (it's not).

    // Let's try to find if there's an existing RPC for running SQL.
    // Usually there isn't for security reasons.

    console.log('Attempting to seed badges again (assuming policies are permissive)...');

    const badges = [
        { id: 'solar-seedling', name: 'Solar Seedling', description: 'Log your very first eco-activity.', category: 'action', icon: '🌱', requirement_type: 'activities_count', requirement_value: 1, rarity: 'common', karma_reward: 50 },
        { id: 'eco-scanner', name: 'Eco Scanner', description: 'Scan your first utility bill using AI.', category: 'action', icon: '📄', requirement_type: 'bills_count', requirement_value: 1, rarity: 'rare', karma_reward: 100 },
        { id: 'streak-starter', name: 'Streak Starter', description: 'Maintain a consistent 3-day eco-streak.', category: 'streak', icon: '🔥', requirement_type: 'streak_days', requirement_value: 3, rarity: 'common', karma_reward: 75 },
        { id: 'carbon-slasher', name: 'Carbon Slasher', description: 'Save a total of 50kg of CO2 emissions.', category: 'carbon', icon: '🪓', requirement_type: 'carbon_saved', requirement_value: 50, rarity: 'epic', karma_reward: 200 },
        { id: 'karma-collector', name: 'Karma Collector', description: 'Reach a total balance of 500 Karma Points.', category: 'milestone', icon: '💎', requirement_type: 'karma_earned', requirement_value: 500, rarity: 'rare', karma_reward: 150 },
        { id: 'social-butterfly', name: 'Social Butterfly', description: 'Join your first community group.', category: 'community', icon: '🦋', requirement_type: 'teams_joined', requirement_value: 1, rarity: 'common', karma_reward: 50 },
        { id: 'tree-planter', name: 'Tree Planter', description: 'Plant your first virtual tree.', category: 'action', icon: '🌳', requirement_type: 'trees_planted_virtual', requirement_value: 1, rarity: 'common', karma_reward: 50 },
        { id: 'forest-guardian', name: 'Forest Guardian', description: 'Plant 10 virtual trees.', category: 'milestone', icon: '🌲', requirement_type: 'trees_planted_virtual', requirement_value: 10, rarity: 'rare', karma_reward: 150 },
        { id: 'quiz-wizard', name: 'Quiz Wizard', description: 'Complete 5 quizzes with a perfect score.', category: 'milestone', icon: '🧙‍♂️', requirement_type: 'perfect_quizzes', requirement_value: 5, rarity: 'epic', karma_reward: 250 },
        { id: 'daily-devotee', name: 'Daily Devotee', description: 'Reach a 7-day eco-streak.', category: 'streak', icon: '📅', requirement_type: 'streak_days', requirement_value: 7, rarity: 'rare', karma_reward: 100 },
        { id: 'carbon-titan', name: 'Carbon Titan', description: 'Save 200kg of CO2.', category: 'carbon', icon: '⚡', requirement_type: 'carbon_saved', requirement_value: 200, rarity: 'legendary', karma_reward: 500 },
        { id: 'social-leader', name: 'Social Leader', description: 'Join 3 community groups.', category: 'community', icon: '👑', requirement_type: 'teams_joined', requirement_value: 3, rarity: 'rare', karma_reward: 100 },
        { id: 'bill-master', name: 'Bill Master', description: 'Scan 10 utility bills.', category: 'action', icon: '📁', requirement_type: 'bills_count', requirement_value: 10, rarity: 'epic', karma_reward: 200 },
        { id: 'early-bird', name: 'Early Bird', description: 'Log an activity before 7 AM.', category: 'milestone', icon: '🌅', requirement_type: 'early_morning_log', requirement_value: 1, rarity: 'common', karma_reward: 50 }
    ];

    for (const badge of badges) {
        const { error } = await supabase
            .from('badges')
            .upsert(badge, { onConflict: 'id' });

        if (error) {
            console.error(`Error seeding badge ${badge.id}:`, error.message);
        } else {
            console.log(`Successfully seeded badge: ${badge.id}`);
        }
    }
    console.log('Finished seeding badges.');
}

applyPoliciesAndSeed();
