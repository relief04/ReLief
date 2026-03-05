import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabaseAdmin';
import { checkIsAdmin } from '@/lib/admin';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await currentUser();
        const email = user?.emailAddresses?.[0]?.emailAddress;

        const isAdmin = await checkIsAdmin(user?.id, email);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const resolvedParams = await params;
        const userId = resolvedParams.id;
        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const db = createAdminClient();

        // 1. Reset Profile Stats
        const { error: profileError } = await db
            .from('profiles')
            .update({
                balance: 0,
                streak: 0,
                longest_streak: 0,
                last_login_date: null,
                carbon_total: 0,
                carbon_savings: 0,
                is_banned: false,
                onboarding_completed: false
            })
            .eq('id', userId);

        if (profileError) {
            return NextResponse.json({ error: `Failed to reset profile stats: ${profileError.message}` }, { status: 500 });
        }

        // 2. Delete related user content (Activities, Posts, Rewards Inventory, Challenge History, Points Log)
        // Note: With ON DELETE CASCADE, deleting a profile does this, but since we are KEEPING 
        // the profile active and just wiping the data, we must do this manually.

        const tablesToDelete = [
            'activities',
            'posts',
            'points_history',
            'user_challenges',
            'user_rewards',
            'user_badges',
            'carbon_budgets',
            'user_quiz_progress',
            'user_quiz_answers',
            'certificates',
            'login_history',
            'event_rsvps'
        ];

        for (const table of tablesToDelete) {
            try {
                await db.from(table).delete().eq('user_id', userId);
            } catch (e) {
                console.error(`Failed to delete from ${table}:`, e);
            }
        }

        return NextResponse.json({ success: true, message: 'User data has been completely reset.' });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
    }
}
