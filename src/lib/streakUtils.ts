import { supabase } from '@/lib/supabaseClient';
import { checkAndAwardBadges } from '@/lib/badgesServer';

export interface LoginHistoryEntry {
    id: string;
    user_id: string;
    login_date: string;
    created_at: string;
}

export interface StreakData {
    current_streak: number;
    longest_streak: number;
}

// ... imports

/**
 * Record today's login for the user and update streak
 */
export async function recordLogin(userId: string): Promise<StreakData | null> {
    console.log("recordLogin called for:", userId);
    try {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

        // Check if user already logged in today
        const { data: existingLogin } = await supabase
            .from('login_history')
            .select('id')
            .eq('user_id', userId)
            .eq('login_date', today)
            .single();

        console.log("Existing login for today?", existingLogin);

        // If already logged in today, just return current streak
        if (existingLogin) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('streak, longest_streak')
                .eq('id', userId)
                .single();

            console.log("User already logged in. Current streak:", profile?.streak);

            return {
                current_streak: profile?.streak || 0,
                longest_streak: profile?.longest_streak || 0
            };
        }

        // Record today's login
        const { error: insertError } = await supabase
            .from('login_history')
            .insert({
                user_id: userId,
                login_date: today
            });

        if (insertError) {
            console.error("Insert Login Error:", insertError);
            // If login_history table doesn't exist, just return current profile streak
            console.warn('Could not record login (table may not exist):', insertError);

            const { data: profile } = await supabase
                .from('profiles')
                .select('streak, longest_streak')
                .eq('id', userId)
                .single();

            return {
                current_streak: profile?.streak || 0,
                longest_streak: profile?.longest_streak || 0
            };
        }

        // Calculate streak manually
        const streak = await calculateStreakManually(userId);
        console.log("Calculated new streak:", streak);

        // Get current longest streak to avoid overwriting
        const { data: currentProfile } = await supabase
            .from('profiles')
            .select('longest_streak')
            .eq('id', userId)
            .single();

        const currentLongest = currentProfile?.longest_streak || 0;
        const newLongest = Math.max(streak, currentLongest);

        // Update profile with new streak
        const { data: profile, error: updateError } = await supabase
            .from('profiles')
            .update({
                streak: streak,
                longest_streak: newLongest
            })
            .eq('id', userId)
            .select('streak, longest_streak')
            .single();

        if (updateError) {
            console.error('Error updating streak:', updateError);
        }

        // Check for new badges after streak update
        await checkAndAwardBadges(userId);

        return {
            current_streak: profile?.streak || streak,
            longest_streak: profile?.longest_streak || newLongest
        };
    } catch (error) {
        console.error('Error in recordLogin:', error);
        // ... (keep fallback)
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('streak, longest_streak')
                .eq('id', userId)
                .single();

            return {
                current_streak: profile?.streak || 0,
                longest_streak: profile?.longest_streak || 0
            };
        } catch {
            return { current_streak: 0, longest_streak: 0 };
        }
    }
}

/**
 * Calculate streak manually by checking consecutive login days
 */
async function calculateStreakManually(userId: string): Promise<number> {
    try {
        // Get all login dates ordered by date descending
        const { data: logins, error } = await supabase
            .from('login_history')
            .select('login_date')
            .eq('user_id', userId)
            .order('login_date', { ascending: false });

        if (error || !logins || logins.length === 0) {
            return 0;
        }

        let streak = 1; // Start with today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < logins.length - 1; i++) {
            const currentDate = new Date(logins[i].login_date);
            const nextDate = new Date(logins[i + 1].login_date);

            currentDate.setHours(0, 0, 0, 0);
            nextDate.setHours(0, 0, 0, 0);

            const dayDiff = Math.floor((currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24));

            if (dayDiff === 1) {
                streak++;
            } else {
                break; // Streak broken
            }
        }

        return streak;
    } catch (error) {
        console.error('Error calculating streak:', error);
        return 0;
    }
}

/**
 * Get login history for calendar visualization
 */
export async function getLoginHistory(
    userId: string,
    startDate?: Date,
    endDate?: Date
): Promise<LoginHistoryEntry[]> {
    try {
        let query = supabase
            .from('login_history')
            .select('*')
            .eq('user_id', userId)
            .order('login_date', { ascending: false });

        if (startDate) {
            query = query.gte('login_date', startDate.toISOString().split('T')[0]);
        }

        if (endDate) {
            query = query.lte('login_date', endDate.toISOString().split('T')[0]);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching login history:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error in getLoginHistory:', error);
        return [];
    }
}

/**
 * Get login dates for the current month (for calendar)
 */
export async function getMonthLoginDates(userId: string, year: number, month: number): Promise<Set<number>> {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    const history = await getLoginHistory(userId, startDate, endDate);

    const loginDates = new Set<number>();
    history.forEach(entry => {
        const date = new Date(entry.login_date);
        loginDates.add(date.getDate());
    });

    return loginDates;
}

/**
 * Calculate current streak manually (backup if DB function fails)
 */
export async function calculateStreak(userId: string): Promise<number> {
    return await calculateStreakManually(userId);
}
