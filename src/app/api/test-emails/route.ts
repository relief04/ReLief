export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import {
    sendWelcomeEmail,
    sendBadgeEmail,
    sendCarbonAlertEmail,
    sendMonthlyReportEmail,
    sendBillProcessedEmail,
    sendAQIAlertEmail,
    sendWeeklyDigestEmail,
    sendCommunityInteractionEmail,
    sendEventReminderEmail
} from '@/lib/email';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');
        const type = searchParams.get('type') || 'all';

        if (!email) {
            return NextResponse.json({ error: 'Please provide an ?email=your@email.com parameter' }, { status: 400 });
        }

        const name = "Eco Warrior";

        if (type === 'welcome' || type === 'all') {
            await sendWelcomeEmail(email, name);
        }

        if (type === 'badge' || type === 'all') {
            await sendBadgeEmail(email, name, "Earth Guardian", "https://cdn-icons-png.flaticon.com/512/5695/5695276.png");
        }

        if (type === 'carbon' || type === 'all') {
            await sendCarbonAlertEmail(email, name, 95);
        }

        if (type === 'report' || type === 'all') {
            await sendMonthlyReportEmail(email, name, 'February', 250, 300); // under budget example
        }

        if (type === 'bill' || type === 'all') {
            await sendBillProcessedEmail(email, name, 250, 205.5, "Electricity");
        }

        if (type === 'aqi' || type === 'all') {
            await sendAQIAlertEmail(email, name, "New Delhi", 450);
        }

        if (type === 'digest' || type === 'all') {
            await sendWeeklyDigestEmail(email, name, 150, 180, 5, "Try air-drying your clothes this week to save an easy 2kg of CO2!");
        }

        if (type === 'interaction' || type === 'all') {
            await sendCommunityInteractionEmail(email, name, "Sarah", "like", "I love this new local park cleanup initiative!");
        }

        if (type === 'event' || type === 'all') {
            await sendEventReminderEmail(email, name, "Downtown Beach Cleanup", "Tomorrow at 9:00 AM", "Ocean Beach Pier");
        }

        return NextResponse.json({ success: true, message: `Sent ${type} emails to ${email}` });

    } catch (error) {
        console.error('Error sending test emails:', error);
        return NextResponse.json({ error: 'Failed to send test emails' }, { status: 500 });
    }
}
