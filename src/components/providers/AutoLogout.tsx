"use client";

import { useEffect } from 'react';
import { useClerk } from '@clerk/nextjs';

export function AutoLogout() {
    const { signOut } = useClerk();

    useEffect(() => {
        // Check if this is a fresh page load (not a navigation)
        const navigationEntry = window.performance?.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
        const isPageLoad = navigationEntry?.type === 'navigate' ||
            window.performance?.navigation?.type === 0;

        if (isPageLoad) {
            // Sign out silently on initial page load
            signOut({ redirectUrl: '/' }).catch(() => {
                // Ignore errors if user is already signed out
            });
        }
    }, [signOut]);

    return null;
}
