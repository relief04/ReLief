import { createAdminClient } from '@/lib/supabaseAdmin';

// Central admin configuration fallback (Initial Bootstrap only)
export const ADMIN_EMAILS = [
    'reliefearth0@gmail.com',
];

/**
 * Returns true if the user is an admin.
 * @param userId - the Clerk User ID.
 * @param fallbackEmail - optional email check for robust bootstrapping.
 */
export async function checkIsAdmin(userId: string | null | undefined, fallbackEmail?: string | null): Promise<boolean> {
    if (!userId) return false;

    // Fast-path lookup if their email is in the hardcoded bootstrap admin list
    if (fallbackEmail && ADMIN_EMAILS.includes(fallbackEmail.toLowerCase().trim())) {
        return true;
    }

    try {
        const adminClient = createAdminClient();
        const { data, error } = await adminClient
            .from('profiles')
            .select('is_admin')
            .eq('id', userId)
            .single();

        if (error || !data) return false;

        return data.is_admin === true;
    } catch {
        return false;
    }
}

/**
 * Legacy synchronous check - Only checks the bootstrap admin list
 * VERY WEAK. DEPRECATED. Use `checkIsAdmin` when possible.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}
