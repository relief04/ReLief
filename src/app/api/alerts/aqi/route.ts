import { NextResponse } from 'next/server';
import { sendAQIAlertEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { email, name, location, aqi } = await request.json();

        if (!email || !location || !aqi) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        // Send AQI email
        await sendAQIAlertEmail(
            email,
            name || 'Eco Warrior',
            location,
            Number(aqi)
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error sending AQI alert:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
