
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndAwardBadges(userId) {
    try {
        console.log(`Checking badges for user: ${userId}`);

        // 1. Fetch available badges and user's already earned badges
        const [{ data: allBadges }, { data: userBadges }] = await Promise.all([
            supabase.from('badges').select('*'),
            supabase.from('user_badges').select('badge_id').eq('user_id', userId)
        ]);

        if (!allBadges) {
            console.error('Could not fetch badges');
            return;
        }

        const earnedBadgeIds = new Set(userBadges?.map(ub => ub.badge_id) || []);
        const unearnedBadges = allBadges.filter(b => !earnedBadgeIds.has(b.id));

        console.log(`Found ${unearnedBadges.length} unearned badges out of ${allBadges.length} total.`);

        if (unearnedBadges.length === 0) {
            console.log('No new badges to check.');
            return;
        }

        // 2. Gather user stats
        const [
            { data: profile },
            { count: activityCount },
            { count: billCount },
            { count: teamCount }
        ] = await Promise.all([
            supabase.from('profiles').select('streak, carbon_savings, balance').eq('id', userId).single(),
            supabase.from('activities').select('*', { count: 'exact', head: true }).eq('user_id', userId),
            supabase.from('bills').select('*', { count: 'exact', head: true }).eq('user_id', userId),
            supabase.from('group_members').select('*', { count: 'exact', head: true }).eq('user_id', userId)
        ]);

        const stats = {
            activities_count: activityCount || 0,
            bills_count: billCount || 0,
            streak_days: profile?.streak || 0,
            carbon_saved: Number(profile?.carbon_savings || 0),
            karma_earned: profile?.balance || 0,
            teams_joined: teamCount || 0,
            badges_earned: earnedBadgeIds.size,
            trees_planted_virtual: 0, // Placeholder
            perfect_quizzes: 0, // Placeholder
            early_morning_log: 0 // Placeholder
        };

        console.log('User Stats:', stats);

        // 3. Check eligibility
        const newEarnedBadges = [];

        for (const badge of unearnedBadges) {
            const currentVal = stats[badge.requirement_type] || 0;
            if (currentVal >= badge.requirement_value) {
                newEarnedBadges.push(badge);
            }
        }

        if (newEarnedBadges.length === 0) {
            console.log('User is not yet eligible for any new badges.');
            return;
        }

        // 4. Award Badges and KP
        console.log(`Awarding ${newEarnedBadges.length} new badges:`, newEarnedBadges.map(b => b.name));

        const badgePromises = newEarnedBadges.map(badge =>
            supabase.from('user_badges').insert({
                user_id: userId,
                badge_id: badge.id
            })
        );

        const totalKarma = newEarnedBadges.reduce((sum, b) => sum + (b.karma_reward || 0), 0);
        const newBalance = (profile?.balance || 0) + totalKarma;

        const results = await Promise.all([
            ...badgePromises,
            supabase.from('profiles').update({ balance: newBalance }).eq('id', userId)
        ]);

        const errors = results.filter(r => r.error).map(r => r.error);
        if (errors.length > 0) {
            console.error('Errors awarding badges:', errors);
        } else {
            console.log(`Successfully awarded badges! Total Karma earned: ${totalKarma}`);
        }

    } catch (error) {
        console.error('Error in checkAndAwardBadges:', error);
    }
}

const targetUserId = 'user_38yrMcEobW7T7WIsNPJBRgDOfoy';
checkAndAwardBadges(targetUserId);
