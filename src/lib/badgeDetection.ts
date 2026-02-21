// Badge Detection and Award Logic
import { supabase } from './supabaseClient';
import { Badge, UserStatsForBadges, checkBadgeEligibility } from './badges';
import { sendBadgeEmail } from './email';

/**
 * Check and award badges for a user based on their current stats
 * @param userId - Clerk user ID
 * @param userStats - Current user statistics
 * @returns Array of newly earned badge IDs
 */
export async function detectAndAwardBadges(
    userId: string,
    userStats: UserStatsForBadges
): Promise<string[]> {
    try {
        // 1. Fetch all badges
        const { data: allBadges, error: badgesError } = await supabase
            .from('badges')
            .select('*');

        if (badgesError || !allBadges) {
            console.error('Error fetching badges:', badgesError);
            return [];
        }

        // 2. Fetch user's already earned badges
        const { data: earnedBadges, error: earnedError } = await supabase
            .from('user_badges')
            .select('badge_id')
            .eq('user_id', userId);

        if (earnedError) {
            console.error('Error fetching earned badges:', earnedError);
            return [];
        }

        const earnedBadgeIds = new Set(earnedBadges?.map(b => b.badge_id) || []);

        // 3. Check which badges the user is now eligible for
        const newlyEarnedBadges: Badge[] = [];

        for (const badge of allBadges) {
            // Skip if already earned
            if (earnedBadgeIds.has(badge.id)) continue;

            // Check eligibility
            if (checkBadgeEligibility(badge, userStats)) {
                newlyEarnedBadges.push(badge);
            }
        }

        // 4. Fetch user profile for email
        const { data: profile } = await supabase
            .from('profiles')
            .select('email, username')
            .eq('id', userId)
            .single();

        // 5. Award new badges
        const newBadgeIds: string[] = [];

        for (const badge of newlyEarnedBadges) {
            const { error: insertError } = await supabase
                .from('user_badges')
                .insert({
                    user_id: userId,
                    badge_id: badge.id,
                    progress: badge.requirement_value // Full progress
                });

            if (!insertError) {
                newBadgeIds.push(badge.id);

                // Award points
                if (badge.karma_reward > 0) {
                    await supabase.rpc('add_karma_points', {
                        p_user_id: userId,
                        p_points: badge.karma_reward
                    });
                }

                console.log(`✅ Badge awarded: ${badge.name} to user ${userId}`);

                if (profile?.email) {
                    sendBadgeEmail(profile.email, profile.username || 'Eco Warrior', badge.name, badge.icon).catch(console.error);
                }
            }
        }

        return newBadgeIds;
    } catch (error) {
        console.error('Error in detectAndAwardBadges:', error);
        return [];
    }
}

/**
 * Update badge progress for in-progress badges
 * @param userId - Clerk user ID
 * @param userStats - Current user statistics
 */
export async function updateBadgeProgress(
    userId: string,
    userStats: UserStatsForBadges
): Promise<void> {
    try {
        // Fetch all badges
        const { data: allBadges } = await supabase
            .from('badges')
            .select('*');

        if (!allBadges) return;

        // Fetch user's earned badges
        const { data: earnedBadges } = await supabase
            .from('user_badges')
            .select('badge_id')
            .eq('user_id', userId);

        const earnedBadgeIds = new Set(earnedBadges?.map(b => b.badge_id) || []);

        // Update progress for unearned badges
        for (const badge of allBadges) {
            if (earnedBadgeIds.has(badge.id)) continue;

            const current = userStats[badge.requirement_type] || 0;

            // Only update if there's progress
            if (current > 0) {
                await supabase
                    .from('user_badges')
                    .upsert({
                        user_id: userId,
                        badge_id: badge.id,
                        progress: current
                    }, {
                        onConflict: 'user_id,badge_id'
                    });
            }
        }
    } catch (error) {
        console.error('Error updating badge progress:', error);
    }
}

/**
 * Get user stats from database for badge detection
 * @param userId - Clerk user ID
 */
export async function getUserStatsForBadges(userId: string): Promise<UserStatsForBadges> {
    try {
        // Fetch profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        // Fetch activity count
        const { count: activitiesCount } = await supabase
            .from('activities')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        // Fetch challenges completed
        const { count: challengesCompleted } = await supabase
            .from('friend_challenges')
            .select('*', { count: 'exact', head: true })
            .eq('winner_id', userId)
            .eq('status', 'completed');

        // Fetch teams joined
        const { count: teamsJoined } = await supabase
            .from('team_members')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        // Fetch teams created
        const { count: teamsCreated } = await supabase
            .from('teams')
            .select('*', { count: 'exact', head: true })
            .eq('creator_id', userId);

        const stats: UserStatsForBadges = {
            activities_count: activitiesCount || 0,
            carbon_saved: profile?.carbon_savings || 0,
            streak_days: profile?.streak || 0,
            teams_joined: teamsJoined || 0,
            teams_created: teamsCreated || 0,
            challenges_completed: challengesCompleted || 0,
            shares_count: profile?.shares_count || 0,
            badges_earned: profile?.badges_earned || 0,
            karma_earned: profile?.balance || 0,

            // Action-specific counts (would need to query activities table with filters)
            bike_commutes: 0,
            transit_uses: 0,
            trees_planted_virtual: 0,
            zero_waste_days: 0,
            plant_based_meals: 0,
            energy_reductions: 0,
            water_savings: 0,
            quizzes_completed: 0,
            items_redeemed: 0,
            aqi_checks: 0,
            relax_sessions: 0,
            user_rank: 0,
            late_night_log: 0,
            early_morning_log: 0,
            countries_logged: 0,
            perfect_quizzes: 0,
            helped_friends: 0,
            team_top_rank: 0
        };

        return stats;
    } catch (error) {
        console.error('Error getting user stats:', error);
        return {
            activities_count: 0,
            carbon_saved: 0,
            streak_days: 0,
            teams_joined: 0,
            teams_created: 0,
            challenges_completed: 0,
            shares_count: 0,
            badges_earned: 0,
            karma_earned: 0,
            bike_commutes: 0,
            transit_uses: 0,
            trees_planted_virtual: 0,
            zero_waste_days: 0,
            plant_based_meals: 0,
            energy_reductions: 0,
            water_savings: 0,
            quizzes_completed: 0,
            items_redeemed: 0,
            aqi_checks: 0,
            relax_sessions: 0,
            user_rank: 0,
            late_night_log: 0,
            early_morning_log: 0,
            countries_logged: 0,
            perfect_quizzes: 0,
            helped_friends: 0,
            team_top_rank: 0
        };
    }
}

/**
 * Trigger badge check after user performs an action
 * Call this after activities are logged, profile is updated, etc.
 */
export async function triggerBadgeCheck(userId: string): Promise<string[]> {
    const stats = await getUserStatsForBadges(userId);
    await updateBadgeProgress(userId, stats);
    const newBadges = await detectAndAwardBadges(userId, stats);
    return newBadges;
}
