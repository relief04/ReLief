import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { sendEventReminderEmail } from '@/lib/email';
import { format, addDays, startOfDay, endOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        // Authenticate cron
        const authHeader = request.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // 1. Calculate the time window for "Tomorrow"
        const now = new Date();
        const tomorrow = addDays(now, 1);
        const startOfTomorrowStr = startOfDay(tomorrow).toISOString();
        const endOfTomorrowStr = endOfDay(tomorrow).toISOString();

        // 2. Fetch all events happening exactly tomorrow
        const { data: events, error: eventsError } = await supabase
            .from('community_events')
            .select(`
                id,
                title,
                date,
                location,
                event_attendees (
                    user_id
                )
            `)
            .gte('date', startOfTomorrowStr)
            .lte('date', endOfTomorrowStr);

        if (eventsError || !events) {
            throw new Error(`Failed to fetch events: ${eventsError?.message}`);
        }

        if (events.length === 0) {
            return NextResponse.json({ success: true, message: 'No events scheduled for tomorrow.' });
        }

        let totalEmailsSent = 0;

        // 3. For each event, process the attendees and send reminders
        for (const event of events) {
            const attendees = event.event_attendees;
            if (!attendees || attendees.length === 0) continue;

            // Fetch the profiles of all attendees to get their emails
            const attendeeIds = attendees.map((a: { user_id: string }) => a.user_id);
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('id, email, username')
                .in('id', attendeeIds)
                .not('email', 'is', null);

            if (profileError || !profiles) {
                console.error('Error fetching attendee profiles:', profileError);
                continue;
            }

            const formattedTime = format(new Date(event.date), "MMM d, h:mm a");

            // Dispatch emails asynchronously
            const emailPromises = profiles.map(async (profile: { email?: string; username?: string }) => {
                if (!profile.email) return;

                await sendEventReminderEmail(
                    profile.email,
                    profile.username || 'Eco Warrior',
                    event.title,
                    formattedTime,
                    event.location || 'See event page for details'
                );
            });

            await Promise.allSettled(emailPromises);
            totalEmailsSent += profiles.length;
        }

        return NextResponse.json({
            success: true,
            message: `Dispatched ${totalEmailsSent} event reminders for ${events.length} events.`
        });

    } catch (error) {
        console.error('Error in event reminders cron:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
