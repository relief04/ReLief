import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Force this route to be dynamic — prevents Next.js from attempting
// static collection at build time (which would fail without env vars)
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    // Initialize Resend lazily inside the handler so it only runs at request time
    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        const body = await request.json();
        const { fullName, emailAddress, subject, message } = body;

        if (!fullName || !emailAddress || !subject || !message) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        if (!process.env.RESEND_API_KEY) {
            console.error('RESEND_API_KEY is not set');
            return NextResponse.json(
                { error: 'Email service not configured' },
                { status: 503 }
            );
        }

        // Send the email using Resend
        const data = await resend.emails.send({
            from: 'ReLief Contact Form <onboarding@resend.dev>', // Use verified domain in production
            to: ['reliefearth0@gmail.com'], // Send to the team's email
            subject: `New Contact Request: ${subject}`,
            html: `
                <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                    <div style="background: linear-gradient(135deg, #10b981, #0ea5e9); padding: 24px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">ReLief</h1>
                        <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0; font-size: 14px;">New Contact Request</p>
                    </div>
                    <div style="padding: 32px 24px;">
                        <div style="margin-bottom: 24px;">
                            <p style="margin: 0 0 8px; color: #94a3b8; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">Sender Details</p>
                            <p style="margin: 0 0 4px; font-size: 16px;"><strong>Name:</strong> ${fullName}</p>
                            <p style="margin: 0; font-size: 16px;"><strong>Email:</strong> <a href="mailto:${emailAddress}" style="color: #10b981; text-decoration: none;">${emailAddress}</a></p>
                        </div>
                        
                        <div style="margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #1e293b;">
                            <p style="margin: 0 0 8px; color: #94a3b8; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">Inquiry Subject</p>
                            <div style="display: inline-block; background-color: rgba(16, 185, 129, 0.1); color: #10b981; padding: 4px 12px; border-radius: 99px; font-weight: 600; font-size: 14px;">
                                ${subject.toUpperCase()}
                            </div>
                        </div>

                        <div>
                            <p style="margin: 0 0 12px; color: #94a3b8; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">Message</p>
                            <div style="background-color: #1e293b; padding: 20px; border-radius: 12px; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
                                ${message.replace(/\n/g, '<br />')}
                            </div>
                        </div>
                    </div>
                    <div style="background-color: #0b1120; padding: 20px 24px; text-align: center; color: #64748b; font-size: 12px;">
                        <p style="margin: 0;">This email was sent from the ReLief Contact Form.</p>
                        <p style="margin: 4px 0 0;">&copy; ${new Date().getFullYear()} ReLief. All rights reserved.</p>
                    </div>
                </div>
            `,
        });

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Email sending error:', error);
        return NextResponse.json(
            { error: 'Failed to send email' },
            { status: 500 }
        );
    }
}
