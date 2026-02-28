"use server";

import { supabase } from '@/lib/supabaseClient';
import { sendBadgeEmail } from '@/lib/email';
import { logPointsHistory } from '@/lib/userUtils';
import { Badge } from '@/lib/badges';

/**
 * Checks if the user is eligible for any new badges and awards them.
 */
export async function checkAndAwardBadges(userId: string) {
    try {
        console.log(`Checking badges for user: ${userId}`);

        // 1. Fetch available badges and user's already earned badges
        const [{ data: allBadges }, { data: userBadges }] = await Promise.all([
            supabase.from('badges').select('*'),
            supabase.from('user_badges').select('badge_id').eq('user_id', userId)
        ]);

        if (!allBadges) return { success: false, error: 'Could not fetch badges' };

        const earnedBadgeIds = new Set(userBadges?.map((ub: { badge_id: string }) => ub.badge_id) || []);
        const unearnedBadges = allBadges.filter((b: Badge) => !earnedBadgeIds.has(b.id));

        if (unearnedBadges.length === 0) {
            return { success: true, newBadges: [] };
        }

        // 2. Gather user stats
        const [
            { data: profile },
            { count: activityCount },
            { count: billCount },
            { count: teamCount }
        ] = await Promise.all([
            supabase.from('profiles').select('streak, carbon_savings, balance, email, username').eq('id', userId).single(),
            supabase.from('activities').select('*', { count: 'exact', head: true }).eq('user_id', userId),
            supabase.from('bills').select('*', { count: 'exact', head: true }).eq('user_id', userId),
            supabase.from('group_members').select('*', { count: 'exact', head: true }).eq('user_id', userId)
        ]);

        const stats: Record<string, number> = {
            activities_count: activityCount || 0,
            bills_count: billCount || 0,
            streak_days: profile?.streak || 0,
            carbon_saved: Number(profile?.carbon_savings || 0),
            karma_earned: profile?.balance || 0,
            teams_joined: teamCount || 0,
            badges_earned: earnedBadgeIds.size
        };

        // 3. Check eligibility
        const newEarnedBadges: Badge[] = [];

        for (const badge of unearnedBadges) {
            const currentVal = stats[badge.requirement_type] || 0;
            if (currentVal >= badge.requirement_value) {
                newEarnedBadges.push(badge);
            }
        }

        if (newEarnedBadges.length === 0) {
            return { success: true, newBadges: [] };
        }

        // 4. Award Badges and KP
        console.log(`Awarding ${newEarnedBadges.length} new badges!`);

        const badgePromises = newEarnedBadges.map(badge =>
            supabase.from('user_badges').insert({
                user_id: userId,
                badge_id: badge.id
            })
        );

        const totalKarma = newEarnedBadges.reduce((sum, b) => sum + (b.karma_reward || 0), 0);
        const newBalance = (profile?.balance || 0) + totalKarma;
        const newBadgeCount = (stats.badges_earned || 0) + newEarnedBadges.length;

        await Promise.all([
            ...badgePromises,
            supabase.from('profiles').update({
                balance: newBalance,
                badge_count: newBadgeCount
            }).eq('id', userId)
        ]);

        // Log points history for each badge awarded
        for (const badge of newEarnedBadges) {
            if (badge.karma_reward > 0) {
                await logPointsHistory(userId, badge.karma_reward, `Earned Badge: ${badge.name}`, 'Badges');
            }
        }

        if (profile?.email) {
            for (const badge of newEarnedBadges) {
                sendBadgeEmail(profile.email, profile.username || 'Eco Warrior', badge.name, badge.icon).catch(console.error);
            }
        }

        return { success: true, newBadges: newEarnedBadges, totalKarma };
    } catch (error) {
        console.error('Error in checkAndAwardBadges:', error);
        return { success: false, error };
    }
}
