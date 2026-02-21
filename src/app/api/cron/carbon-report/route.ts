import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { sendMonthlyReportEmail } from '@/lib/email';

export async function POST(request: Request) {
    try {
        // Authenticate the cron job (e.g. using a secret header)
        const authHeader = request.headers.get('Authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id, email, username, carbon_total');

        if (error || !profiles) {
            console.error('Failed to fetch profiles for cron job:', error);
            return NextResponse.json({ error: 'Database fetch failed' }, { status: 500 });
        }

        const monthName = new Date().toLocaleString('default', { month: 'long' });

        // This is a simplified approach summing users. In a real system you'd filter by month range.
        const defaultBudget = 300; // 300kg default budget

        for (const profile of profiles) {
            if (profile.email) {
                // Send email synchronously or fire-and-forget
                await sendMonthlyReportEmail(
                    profile.email,
                    profile.username || 'Eco Warrior',
                    monthName,
                    profile.carbon_total || 0,
                    defaultBudget
                ).catch(console.error);
            }
        }

        return NextResponse.json({ success: true, count: profiles.length });
    } catch (error) {
        console.error('Error running carbon report cron:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
