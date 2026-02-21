"use client";
import { useEnsureProfile } from '@/hooks/useEnsureProfile';

/**
 * Client component wrapper to ensure user profile sync
 * This must be a client component because it uses hooks
 */
export function ProfileSyncWrapper({ children }: { children: React.ReactNode }) {
    useEnsureProfile();
    return <>{children}</>;
}
