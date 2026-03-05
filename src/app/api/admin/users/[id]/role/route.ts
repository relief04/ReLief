import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabaseAdmin';
import { checkIsAdmin } from '@/lib/admin';

export async function POST(
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
        const targetUserId = resolvedParams.id;

        if (!targetUserId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const body = await request.json();
        const assignAdmin = Boolean(body.isAdmin); // true to make admin, false to remove

        const db = createAdminClient();

        // Optional safety net: Prevent self-demotion or removing the main owner
        if (targetUserId === user?.id && !assignAdmin) {
            return NextResponse.json({ error: 'You cannot remove your own admin access here.' }, { status: 400 });
        }

        const { error: profileError } = await db
            .from('profiles')
            .update({
                is_admin: assignAdmin
            })
            .eq('id', targetUserId);

        if (profileError) {
            return NextResponse.json({ error: `Failed to modify admin role: ${profileError.message}` }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: assignAdmin ? 'User has been granted Admin rights.' : 'User Admin rights revoked.'
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
    }
}
