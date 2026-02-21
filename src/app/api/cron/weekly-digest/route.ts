import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { sendWeeklyDigestEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

// This route should ideally be protected by a secure Cron secret in Vercel
export async function POST(request: Request) {
    try {
        // Authenticate the cron job
        const authHeader = request.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // 1. Fetch all users who have 'weeklySummary' enabled
        // In this MVP we assume all active profiles get it, 
        // but normally we would join against a preferences table.
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .not('email', 'is', null);

        if (profileError || !profiles) {
            throw new Error('Failed to fetch user profiles for digest');
        }

        const emailPromises = profiles.map(async (profile) => {
            if (!profile.email) return;

            // 2. Fetch Weekly Emissions Data 
            // Mocking the aggregate calculation for the MVP since we don't have
            // a standardized time-series carbon entry table yet.
            const mockThisWeekEmissions = Math.floor(Math.random() * (300 - 150 + 1)) + 150;
            const mockLastWeekEmissions = Math.floor(Math.random() * (300 - 150 + 1)) + 150;

            // 3. Generate a dynamic eco-tip based on their usage (Mocked)
            const tips = [
                "Air-drying your clothes this week can save up to 2kg of CO₂!",
                "Try Meatless Monday! Skipping meat one day a week saves roughly 3kg of carbon.",
                "Unplugging phantom electronics can reduce your energy footprint by 10%.",
                "Switch to cold water for laundry to save energy and protect your clothes.",
                "Consolidate your online shopping deliveries to reduce transport emissions."
            ];
            const randomTip = tips[Math.floor(Math.random() * tips.length)];

            // 4. Calculate Mock Percentile (Top 5%, 10%, 20%)
            const percentile = Math.floor(Math.random() * 20) + 1;

            // 5. Dispatch the rich email
            await sendWeeklyDigestEmail(
                profile.email,
                profile.username || 'Eco Warrior',
                mockThisWeekEmissions,
                mockLastWeekEmissions,
                percentile,
                randomTip
            );
        });

        // Use Promise.allSettled so one failure doesn't crash the whole batch
        await Promise.allSettled(emailPromises);

        return NextResponse.json({
            success: true,
            message: `Dispatched weekly digests to ${profiles.length} users.`
        });

    } catch (error) {
        console.error('Error in weekly digest cron:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
