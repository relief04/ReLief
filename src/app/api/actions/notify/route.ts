import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { sendActivityLoggedEmail, sendPostPublishedEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, actionType, metadata } = body;

        if (!userId || !actionType) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Fetch User Profile to get their email and name
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('email, username')
            .eq('id', userId)
            .single();

        if (profileError || !profile || !profile.email) {
            return NextResponse.json({ error: 'User not found or has no email' }, { status: 404 });
        }

        const userName = profile.username || 'Eco Warrior';

        // Dispatch specific email based on Action Type
        if (actionType === 'daily_log') {
            await sendActivityLoggedEmail(
                profile.email,
                userName,
                metadata.activityName || 'Daily Footprint',
                metadata.impact || '0 kg CO₂'
            );
        } else if (actionType === 'new_post') {
            await sendPostPublishedEmail(
                profile.email,
                userName,
                metadata.contentPreview || 'A new post'
            );
        } else {
            return NextResponse.json({ error: 'Invalid actionType' }, { status: 400 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error handling action email:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
