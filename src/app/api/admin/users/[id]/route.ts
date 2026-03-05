import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabaseAdmin';
import { checkIsAdmin } from '@/lib/admin';

// DELETE /api/admin/users/[id] — delete a user profile (bypasses RLS via service role)
export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;
    const isAdmin = await checkIsAdmin(user?.id, email);
    if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const resolvedParams = await params;

    const db = createAdminClient();
    const { error } = await db
        .from('profiles')
        .delete()
        .eq('id', resolvedParams.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
