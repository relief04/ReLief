import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabaseAdmin';
import { isAdminEmail } from '@/lib/admin';

async function verifyAdmin() {
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;
    if (!user || !isAdminEmail(email)) return null;
    return user;
}

// PATCH /api/admin/posts/[id] — update post content (bypasses RLS via service role)
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    if (!await verifyAdmin()) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { content } = await req.json();
    const db = createAdminClient();
    const { error } = await db
        .from('posts')
        .update({ content })
        .eq('id', params.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}

// DELETE /api/admin/posts/[id] — delete a post (bypasses RLS via service role)
export async function DELETE(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    if (!await verifyAdmin()) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const db = createAdminClient();
    const { error } = await db
        .from('posts')
        .delete()
        .eq('id', params.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
