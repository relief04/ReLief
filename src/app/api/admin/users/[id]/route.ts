import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabaseAdmin';
import { isAdminEmail } from '@/lib/admin';

// DELETE /api/admin/users/[id] — delete a user profile (bypasses RLS via service role)
export async function DELETE(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;
    if (!user || !isAdminEmail(email)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const db = createAdminClient();
    const { error } = await db
        .from('profiles')
        .delete()
        .eq('id', params.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
