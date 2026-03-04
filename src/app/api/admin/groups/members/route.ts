import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabaseAdmin';
import { isAdminEmail } from '@/lib/admin';

export async function PUT(request: Request) {
    try {
        const user = await currentUser();
        const email = user?.emailAddresses?.[0]?.emailAddress;

        if (!user || !isAdminEmail(email)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { user_id, group_id, role } = body;

        if (!user_id || !group_id || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabaseAdmin = createAdminClient();

        const { error: updateError } = await supabaseAdmin
            .from('group_members')
            .update({ role })
            .match({ user_id, group_id });

        if (updateError) {
            console.error('Error updating group member role:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Group role updated successfully' });
    } catch (error) {
        console.error('Error in update group member API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const user = await currentUser();
        const email = user?.emailAddresses?.[0]?.emailAddress;

        if (!user || !isAdminEmail(email)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { user_id, group_id } = body;

        if (!user_id || !group_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabaseAdmin = createAdminClient();

        const { error: deleteError } = await supabaseAdmin
            .from('group_members')
            .delete()
            .match({ user_id, group_id });

        if (deleteError) {
            console.error('Error deleting group member:', deleteError);
            return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Group member removed successfully' });
    } catch (error) {
        console.error('Error in delete group member API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
