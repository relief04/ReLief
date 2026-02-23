// Real-time Supabase Hook
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Custom hook for real-time table subscriptions
 * @param table - Table name to subscribe to
 * @param filter - Optional filter (e.g., 'user_id=eq.123')
 * @param callback - Function called when data changes
 */
export function useRealtimeSubscription<T>(
    table: string,
    filter?: string,
    callback?: (payload: any) => void
) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let channel: RealtimeChannel;

        // Initial fetch
        async function fetchInitialData() {
            try {
                let query = supabase.from(table).select('*');

                // Apply filter if provided
                if (filter) {
                    const [column, operator, value] = filter.split(/[=.]/);
                    if (operator === 'eq') {
                        query = query.eq(column, value);
                    }
                }

                const { data: initialData, error: fetchError } = await query;

                if (fetchError) throw fetchError;

                setData(initialData as T[]);
                setLoading(false);
            } catch (err) {
                setError(err as Error);
                setLoading(false);
            }
        }

        fetchInitialData();

        // Set up real-time subscription
        channel = supabase
            .channel(`${table}-changes`)
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to all events: INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: table,
                    filter: filter
                },
                (payload: any) => {
                    console.log(`Real-time update on ${table}:`, payload);

                    // Update local state based on event type
                    if (payload.eventType === 'INSERT') {
                        setData((current) => [...current, payload.new as T]);
                    } else if (payload.eventType === 'UPDATE') {
                        setData((current) =>
                            current.map((item: any) =>
                                item.id === payload.new.id ? (payload.new as T) : item
                            )
                        );
                    } else if (payload.eventType === 'DELETE') {
                        setData((current) =>
                            current.filter((item: any) => item.id !== payload.old.id)
                        );
                    }

                    // Call custom callback if provided
                    if (callback) {
                        callback(payload);
                    }
                }
            )
            .subscribe();

        // Cleanup subscription on unmount
        return () => {
            supabase.removeChannel(channel);
        };
    }, [table, filter]);

    return { data, loading, error, refetch: () => setLoading(true) };
}

/**
 * Hook for real-time leaderboard updates
 */
export function useRealtimeLeaderboard(rankingType: 'carbon_savings' | 'streak' | 'karma_points' | 'badges') {
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const columnMap = {
            carbon_savings: 'carbon_savings',
            streak: 'streak',
            karma_points: 'balance',
            badges: 'badge_count'
        };

        const column = columnMap[rankingType];
        let channel: RealtimeChannel;

        // Fetch initial leaderboard
        async function fetchLeaderboard() {
            const { data } = await supabase
                .from('profiles')
                .select('id, username, avatar_url, carbon_savings, streak, balance, badge_count')
                .order(column, { ascending: false, nullsFirst: false })
                .order('balance', { ascending: false })
                .order('username', { ascending: true })
                .limit(100);

            setLeaderboard(data || []);
            setLoading(false);
        }

        fetchLeaderboard();

        // Subscribe to profile changes
        channel = supabase
            .channel('leaderboard-updates')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles'
                },
                () => {
                    // Refetch leaderboard when any profile updates
                    fetchLeaderboard();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [rankingType]);

    return { leaderboard, loading };
}

/**
 * Hook for real-time badge notifications
 */
export function useRealtimeBadges(userId: string) {
    const [newBadges, setNewBadges] = useState<any[]>([]);

    useEffect(() => {
        const channel = supabase
            .channel(`user-badges-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'user_badges',
                    filter: `user_id=eq.${userId}`
                },
                async (payload: any) => {
                    // Fetch badge details
                    const { data: badge } = await supabase
                        .from('badges')
                        .select('*')
                        .eq('id', payload.new.badge_id)
                        .single();

                    if (badge) {
                        setNewBadges((current) => [...current, badge]);

                        // Show notification
                        showBadgeNotification(badge);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);

    return { newBadges, clearBadges: () => setNewBadges([]) };
}

/**
 * Hook for real-time activity feed
 */
export function useRealtimeActivities(userId?: string) {
    const filter = userId ? `user_id=eq.${userId}` : undefined;

    return useRealtimeSubscription<any>(
        'activities',
        filter,
        (payload) => {
            if (payload.eventType === 'INSERT') {
                console.log('New activity logged:', payload.new);
            }
        }
    );
}

/**
 * Show badge notification (you can customize this)
 */
function showBadgeNotification(badge: any) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🏆 New Badge Earned!', {
            body: `You earned: ${badge.name}`,
            icon: badge.icon
        });
    }

    // You can also use a toast library like react-hot-toast
    console.log('🏆 Badge earned:', badge.name);
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
    }
}
