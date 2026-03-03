import { NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        // Fetch user profile
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('email, username')
            .eq('id', userId)
            .single();

        if (error || !profile?.email) {
            return NextResponse.json({ error: 'Profile or email not found' }, { status: 404 });
        }

        const name = profile.username || 'Eco Warrior';

        // Send welcome email
        const result = await sendWelcomeEmail(profile.email, name);

        if (!result.success) {
            return NextResponse.json({ error: 'Failed to send email', details: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error sending welcome email:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
