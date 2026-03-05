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
    ];

    for (const table of relatedTables) {
        try {
            await db.from(table).delete().eq('user_id', userId);
        } catch { }
    }

    // Also clean friendships where user is the friend
    try { await db.from('friendships').delete().eq('friend_id', userId); } catch { }

    // Now delete the profile (cascading tables like activities, user_rewards etc. will auto-delete)
    const { error } = await db
        .from('profiles')
        .delete()
        .eq('id', userId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
