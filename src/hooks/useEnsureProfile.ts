import { useUser } from '@clerk/nextjs';
import { useEffect } from 'react';
import { ensureUserProfile } from '@/lib/userUtils';

/**
 * Hook to automatically ensure the current Clerk user has a profile in Supabase
 * Call this in your main layout or app component
 */
export function useEnsureProfile() {
    const { user, isLoaded } = useUser();

    useEffect(() => {
        async function syncProfile() {
            if (!isLoaded || !user) return;

            try {
                await ensureUserProfile(
                    user.id,
                    user.primaryEmailAddress?.emailAddress,
                    user.username || user.fullName || user.firstName || `user_${user.id.substring(0, 8)}`,
                    user.imageUrl
                );
            } catch (error) {
                console.error('Failed to sync user profile:', error);
            }
        }

        syncProfile();
    }, [user, isLoaded]);
}
