import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabaseAdmin';

export async function POST() {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = user.id;
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

        // 2. Delete related user content
        const tablesToDelete = [
            'activities',
            'posts',
            'post_likes',
            'comments',
            'group_posts',
            'group_messages',
            'story_likes',
            'notifications',
            'points_history',
            'user_challenges',
            'user_rewards',
            'user_badges',
            'carbon_budgets',
            'carbon_logs',
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

        return NextResponse.json({ success: true, message: 'Your data has been completely reset.' });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
    }
}
