import { supabase } from '@/lib/supabaseClient';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetches the user's profile from the 'profiles' table.
 * Retries once on network failure (Failed to fetch).
 */
export async function getUserProfile(userId: string, retries = 1): Promise<any> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

    if (error) {
        const msg = error.message || JSON.stringify(error);
        if (msg.includes('Failed to fetch') && retries > 0) {
            await sleep(1000);
            return getUserProfile(userId, retries - 1);
        }
        console.error('Error fetching profile:', msg);
        return null;
    }
    return data;
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
        console.error('Error creating profile:', error.message || JSON.stringify(error));
        return { data: null, error };
    }

    console.log('Created new profile for user:', userId);
    return { data, error: null };
}

/**
 * Updates the user's stats: carbon_total, carbon_savings, and balance (Points).
 */
export async function updateUserStats(userId: string, emission: number, karmaToAdd: number, savingsToAdd: number = 0) {
    // 1. Get current stats
    const profile = await getUserProfile(userId);
    if (!profile) return { error: 'Profile not found' };

    const newTotal = (profile.carbon_total || 0) + emission;
    const newSavings = (profile.carbon_savings || 0) + savingsToAdd;
    const newBalance = (profile.balance || 0) + karmaToAdd;

    const { error } = await supabase
        .from('profiles')
        .update({
            carbon_total: newTotal,
            carbon_savings: newSavings,
            balance: newBalance
        })
        .eq('id', userId);

    return { error };
}

