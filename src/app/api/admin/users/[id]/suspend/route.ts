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
        const userId = resolvedParams.id;
        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const body = await request.json();
        const isBanned = Boolean(body.isBanned);

        const db = createAdminClient();

        const { error } = await db
            .from('profiles')
            .update({ is_banned: isBanned })
            .eq('id', userId);

        if (error) {
            return NextResponse.json({ error: `Database update failed: ${error.message}` }, { status: 500 });
        }

        return NextResponse.json({ success: true, is_banned: isBanned });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
