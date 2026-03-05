import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabaseAdmin';
import { checkIsAdmin } from '@/lib/admin';

// DELETE /api/admin/users/[id] — delete a user profile and all related data
export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;
    const isAdmin = await checkIsAdmin(user?.id, email);
    if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const resolvedParams = await params;
    const userId = resolvedParams.id;
    const db = createAdminClient();

    // Delete related records that might not have ON DELETE CASCADE
    const relatedTables = [
        'posts',
        'post_likes',
        'comments',
        'group_members',
        'group_posts',
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
        'user_quiz_progress',
        'user_quiz_answers',
        'certificates',
        'login_history',
    ];

    for (const table of relatedTables) {
        try {
            await db.from(table).delete().eq('user_id', userId);
        } catch { }
    }

    // Also clean friendships where user is the friend
    try { await db.from('friendships').delete().eq('friend_id', userId); } catch { }

    // Try deleting from Clerk first so we don't have orphan auth users
    try {
        const { clerkClient } = await import('@clerk/nextjs/server');
        const client = await clerkClient();
        await client.users.deleteUser(userId);
    } catch (e: any) {
        // If the user doesn't exist in Clerk (404), we still want to delete DB data
        if (e.status !== 404) {
            console.error('Failed to delete user from Clerk:', e);
        }
    }

    // Now delete the profile
    const { error } = await db
        .from('profiles')
        .delete()
        .eq('id', userId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
