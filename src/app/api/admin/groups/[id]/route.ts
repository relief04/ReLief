import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabaseAdmin';
import { isAdminEmail } from '@/lib/admin';

export async function PATCH(
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
        const groupId = resolvedParams.id;

        if (!groupId) {
            return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
        }

        const { name, description } = await request.json();

        if (!name && !description) {
            return NextResponse.json({ error: 'No data provided to update' }, { status: 400 });
        }

        const updates: any = {};
        if (name) updates.name = name;
        if (description) updates.description = description;

        const supabaseAdmin = createAdminClient();

        const { error: updateError } = await supabaseAdmin
            .from('groups')
            .update(updates)
            .eq('id', groupId);

        if (updateError) {
            console.error('Error updating group:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Group updated successfully' });
    } catch (error) {
        console.error('Error in update group API:', error);
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
        const groupId = resolvedParams.id;

        if (!groupId) {
            return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
        }

        const supabaseAdmin = createAdminClient();

        const { error: deleteError } = await supabaseAdmin
            .from('groups')
            .delete()
            .eq('id', groupId);

        if (deleteError) {
            console.error('Error deleting group:', deleteError);
            return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Group deleted successfully' });
    } catch (error) {
        console.error('Error in delete group API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
