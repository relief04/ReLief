import { supabase } from '@/lib/supabaseClient';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetches the user's profile from the 'profiles' table.
 * Retries once on network failure (Failed to fetch).
 */
export async function getUserProfile(userId: string, retries = 1): Promise<any> {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (error) {
            const msg = error.message || JSON.stringify(error);
            if (msg.includes('Failed to fetch') && retries > 0) {
                console.warn(`Profile fetch failed, retrying... (${retries} left)`);
                await sleep(1000);
                return await getUserProfile(userId, retries - 1);
            }
            console.error('Supabase profile query error:', msg);
            return null;
        }

        return data;
    } catch (err: any) {
        // Handle actual network throw errors (like CORS or DNS failures)
        const msg = err.message || JSON.stringify(err);
        if (msg.includes('Failed to fetch') && retries > 0) {
            console.warn(`Profile fetch threw error, retrying... (${retries} left)`);
            await sleep(1000);
            return await getUserProfile(userId, retries - 1);
        }
        console.error('Error exception fetching profile:', msg);
        return null;
    }
}

/**
 * Ensures a user profile exists in Supabase.
 * Creates one if it doesn't exist (for Clerk users).
 */
export async function ensureUserProfile(userId: string, email?: string, username?: string, avatarUrl?: string) {
    // Check if profile already exists
    const existing = await getUserProfile(userId);
    if (existing) {
        return { data: existing, error: null };
    }

    try {
        // Create new profile
        const { data, error } = await supabase
            .from('profiles')
            .insert({
                id: userId,
                email: email || '',
                username: username || 'User',
                avatar_url: avatarUrl || '',
                carbon_total: 0,
                carbon_savings: 0,
                streak: 0,
                balance: 0
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase error creating profile:', error.message || JSON.stringify(error));
            return { data: null, error };
        }

        console.log('Created new profile for user:', userId);
        return { data, error: null };
    } catch (err: any) {
        console.error('Error exception creating profile:', err.message || JSON.stringify(err));
        return { data: null, error: err };
    }
}

/**
 * Logs points history to the points_history table.
 */
export async function logPointsHistory(userId: string, amount: number, action: string, source: string) {
    if (amount === 0) return { error: null };
    const { error } = await supabase
        .from('points_history')
        .insert({
            user_id: userId,
            amount,
            action,
            source
        });
    if (error) {
        console.error('Error logging points history:', error.message || JSON.stringify(error));
    }
    return { error };
}

/**
 * Updates the user's stats: carbon_total, carbon_savings, and balance (Points).
 */
export async function updateUserStats(userId: string, emission: number, impactToAdd: number, savingsToAdd: number = 0, action?: string, source?: string) {
    // 1. Get current stats
    const profile = await getUserProfile(userId);
    if (!profile) return { error: 'Profile not found' };

    const newTotal = (profile.carbon_total || 0) + emission;
    const newSavings = (profile.carbon_savings || 0) + savingsToAdd;
    const newBalance = (profile.balance || 0) + impactToAdd;

    const { error } = await supabase
        .from('profiles')
        .update({
            carbon_total: newTotal,
            carbon_savings: newSavings,
            balance: newBalance
        })
        .eq('id', userId);

    if (!error && impactToAdd > 0 && action && source) {
        await logPointsHistory(userId, impactToAdd, action, source);
    }

    return { error };
}
