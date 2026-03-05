import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabaseAdmin';
import { checkIsAdmin } from '@/lib/admin';

export async function DELETE(
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
        const eventId = resolvedParams.id;

        if (!eventId) {
            return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
        }

        const supabaseAdmin = createAdminClient();

        // Perform hard delete out of the DB for the event
        const { error: deleteError } = await supabaseAdmin
            .from('events')
            .delete()
            .eq('id', eventId);

        if (deleteError) {
            console.error('Error deleting event:', deleteError);
            return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error in delete event API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
