import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabaseAdmin';
import { isAdminEmail } from '@/lib/admin';

export async function GET() {
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;

    if (!user || !isAdminEmail(email)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const db = createAdminClient();

    const [
        { count: userCount },
        { count: postCount },
        { count: groupCount },
        { count: badgeCount },
        { data: recentPosts },
        { data: recentUsers },
    ] = await Promise.all([
        db.from('profiles').select('*', { count: 'exact', head: true }),
        db.from('posts').select('*', { count: 'exact', head: true }),
        db.from('groups').select('*', { count: 'exact', head: true }),
        db.from('user_badges').select('*', { count: 'exact', head: true }),
        db
            .from('posts')
            .select('id, author_name, content, created_at, user_id')
            .order('created_at', { ascending: false })
            .limit(10),
        db
            .from('profiles')
            .select('id, username, email, created_at, balance')
            .order('created_at', { ascending: false })
            .limit(10),
    ]);

    return NextResponse.json({
        stats: {
            users: userCount ?? 0,
            posts: postCount ?? 0,
            groups: groupCount ?? 0,
            badges: badgeCount ?? 0,
        },
        recentPosts: recentPosts ?? [],
        recentUsers: recentUsers ?? [],
    });
}
