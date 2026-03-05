import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabaseAdmin';
import { checkIsAdmin } from '@/lib/admin';

export async function GET(
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

        const [
            { data: profile, error: profileError },
            { data: posts },
            { data: challenges },
            { data: rewards },
            { data: pointsHistory },
            { data: badges },
            { data: stories },
            { data: rsvps },
            { data: groupMembers }
        ] = await Promise.all([
            db.from('profiles').select('*').eq('id', userId).single(),
            db.from('posts').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
            db.from('user_challenges').select('*, challenges(*)').eq('user_id', userId).order('start_date', { ascending: false }).limit(10),
            db.from('user_rewards').select('*, rewards(*)').eq('user_id', userId).order('acquired_at', { ascending: false }).limit(20),
            db.from('points_history').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
            db.from('user_badges').select('*, badges(*)').eq('user_id', userId).order('earned_at', { ascending: false }).limit(20),
            db.from('success_stories').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
            db.from('event_rsvps').select('*, events(*)').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
            db.from('group_members').select('*, groups(*)').eq('user_id', userId).order('joined_at', { ascending: false }).limit(20)
        ]);

        if (profileError) {
            return NextResponse.json({ error: `User profile not found: ${profileError.message}` }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            user_data: {
                profile,
                posts: posts || [],
                challenges: challenges || [],
                rewards: rewards || [],
                pointsHistory: pointsHistory || [],
                badges: badges || [],
                stories: stories || [],
                events: rsvps || [],
                groups: groupMembers || []
            }
        });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
