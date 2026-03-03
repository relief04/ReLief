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

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
        { count: userCount },
        { count: postCount },
        { count: groupCount },
        { count: badgeCount },
        { count: eventCount },
        { count: storyCount },
        { data: recentPosts },
        { data: recentUsers },
        { data: groupsList },
        { data: historicalUsers },
        { data: eventsList },
        { data: storiesList },
    ] = await Promise.all([
        db.from('profiles').select('*', { count: 'exact', head: true }),
        db.from('posts').select('*', { count: 'exact', head: true }),
        db.from('groups').select('*', { count: 'exact', head: true }),
        db.from('user_badges').select('*', { count: 'exact', head: true }),
        db.from('events').select('*', { count: 'exact', head: true }),
        db.from('success_stories').select('*', { count: 'exact', head: true }),
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
        db
            .from('groups')
            .select('id, name, description, created_at')
            .order('created_at', { ascending: false }),
        db
            .from('profiles')
            .select('created_at')
            .gte('created_at', thirtyDaysAgo.toISOString())
            .order('created_at', { ascending: true }),
        db
            .from('events')
            .select('id, title, description, event_type, created_by, event_date')
            .order('event_date', { ascending: false })
            .limit(20),
        db
            .from('success_stories')
            .select('id, title, story, achievement_type, author_name, likes')
            .order('created_at', { ascending: false })
            .limit(20),
    ]);

    // Format historical users into a daily count for Recharts
    const growthDataMap = new Map<string, number>();
    historicalUsers?.forEach(u => {
        const date = u.created_at.split('T')[0];
        growthDataMap.set(date, (growthDataMap.get(date) || 0) + 1);
    });

    // Fill in empty days
    const chartData = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        chartData.push({
            date: dateStr,
            users: growthDataMap.get(dateStr) || 0
        });
    }

    return NextResponse.json({
        stats: {
            users: userCount ?? 0,
            posts: postCount ?? 0,
            groups: groupCount ?? 0,
            badges: badgeCount ?? 0,
            events: eventCount ?? 0,
            stories: storyCount ?? 0,
        },
        recentPosts: recentPosts ?? [],
        recentUsers: recentUsers ?? [],
        groups: groupsList ?? [],
        events: eventsList ?? [],
        stories: storiesList ?? [],
        chartData
    });
}
