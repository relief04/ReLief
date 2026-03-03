import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabaseAdmin';
import { isAdminEmail } from '@/lib/admin';

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
        const storyId = resolvedParams.id;

        if (!storyId) {
            return NextResponse.json({ error: 'Story ID is required' }, { status: 400 });
        }

        const supabaseAdmin = createAdminClient();

        // Perform hard delete out of the DB for stories
        const { error: deleteError } = await supabaseAdmin
            .from('success_stories')
            .delete()
            .eq('id', storyId);

        if (deleteError) {
            console.error('Error deleting story:', deleteError);
            return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Story deleted successfully' });
    } catch (error) {
        console.error('Error in delete story API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
