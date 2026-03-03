import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabaseAdmin';
import { isAdminEmail } from '@/lib/admin';
import { updateUserStats } from '@/lib/userUtils';

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
        const karmaDelta = Number(body.karmaDelta);

        if (isNaN(karmaDelta) || karmaDelta === 0) {
            return NextResponse.json({ error: 'Valid karmaDelta is required' }, { status: 400 });
        }

        // Use the native utility to securely add points & log it
        const { error: updateError } = await updateUserStats(
            userId,
            0,
            karmaDelta,
            0,
            'Admin Override',
            'Admin Dashboard'
        );

        if (updateError) {
            return NextResponse.json({ error: `Failed to update points: ${updateError}` }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: `Successfully modified karma by ${karmaDelta}` });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
