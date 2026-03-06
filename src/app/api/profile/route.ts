import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabaseAdmin';

export async function DELETE() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = createAdminClient();

        // 1. Delete related records (linked by user_id)
        const relatedTables = [
            'posts',
            'post_likes',
            'comments',
            'group_members',
            'group_posts',
            'group_messages',
            'event_rsvps',
            'friendships',
            'notifications',
            'success_stories',
            'story_likes',
            'activities',
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
        ];

        for (const table of relatedTables) {
            try {
                await db.from(table).delete().eq('user_id', userId);
            } catch (err: any) {
                console.error(`Failed to delete from ${table}:`, err);
            }
        }

        // 2. Delete entities created by the user (linked by created_by)
        const createdEntities = [
            'groups',
            'events'
        ];

        for (const table of createdEntities) {
            try {
                await db.from(table).delete().eq('created_by', userId);
            } catch (err: any) {
                console.error(`Failed to delete created entity ${table}:`, err);
            }
        }

        // Also clean friendships where user is the friend
        try {
            await db.from('friendships').delete().eq('friend_id', userId);
        } catch (err: any) {
            console.error(`Failed to delete friend friendships:`, err);
        }

        // 2. Delete from Clerk
        try {
            const client = await clerkClient();
            await client.users.deleteUser(userId);
            console.log(`Successfully deleted user ${userId} from Clerk.`);
        } catch (e: any) {
            // If the user doesn't exist in Clerk (404), we still want to delete DB data
            if (e.status === 404) {
                console.warn(`User ${userId} not found in Clerk, proceeding with profile deletion.`);
            } else {
                console.error('Failed to delete user from Clerk:', e);
                return NextResponse.json({
                    error: 'Failed to delete account from auth provider',
                    details: e.message
                }, { status: 500 });
            }
        }

        // 3. Delete the profile
        const { error } = await db
            .from('profiles')
            .delete()
            .eq('id', userId);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
    }
}
