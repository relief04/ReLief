import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabaseAdmin';
import { isAdminEmail } from '@/lib/admin';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await currentUser();
        const email = user?.emailAddresses?.[0]?.emailAddress;

        if (!user || !isAdminEmail(email)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const resolvedParams = await params;
        const rsvpId = resolvedParams.id;

        if (!rsvpId) {
            return NextResponse.json({ error: 'RSVP ID is required' }, { status: 400 });
        }

        const body = await request.json();
        const { status } = body;

        const supabaseAdmin = createAdminClient();

        const { error: updateError } = await supabaseAdmin
            .from('event_rsvps')
            .update({ status })
            .eq('id', rsvpId);

        if (updateError) {
            console.error('Error updating RSVP:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'RSVP updated successfully' });
    } catch (error) {
        console.error('Error in update RSVP API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await currentUser();
        const email = user?.emailAddresses?.[0]?.emailAddress;

        if (!user || !isAdminEmail(email)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const resolvedParams = await params;
        const rsvpId = resolvedParams.id;

        if (!rsvpId) {
            return NextResponse.json({ error: 'RSVP ID is required' }, { status: 400 });
        }

        const supabaseAdmin = createAdminClient();

        const { error: deleteError } = await supabaseAdmin
            .from('event_rsvps')
            .delete()
            .eq('id', rsvpId);

        if (deleteError) {
            console.error('Error deleting RSVP:', deleteError);
            return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'RSVP deleted successfully' });
    } catch (error) {
        console.error('Error in delete RSVP API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
