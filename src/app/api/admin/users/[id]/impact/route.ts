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
        const newBalanceInput = Number(body.newBalance);

        if (isNaN(newBalanceInput) || newBalanceInput < 0) {
            return NextResponse.json({ error: 'Valid positive newBalance is required' }, { status: 400 });
        }

        const adminClient = createAdminClient();

        // 1. Get current balance using the admin client (bypasses CORS and RLS)
        const { data: profile, error: fetchError } = await adminClient
            .from('profiles')
            .select('balance')
            .eq('id', userId)
            .single();

        if (fetchError || !profile) {
            return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
        }

        const currentBalance = profile.balance ?? 0;
        const difference = newBalanceInput - currentBalance;

        if (difference === 0) {
            return NextResponse.json({
                success: true,
                message: `Balance unchanged`,
                newBalance: currentBalance,
                previousBalance: currentBalance
            });
        }

        // 2. Update the balance
        const { error: updateError } = await adminClient
            .from('profiles')
            .update({ balance: newBalanceInput })
            .eq('id', userId);

        if (updateError) {
            return NextResponse.json({ error: `Failed to update points: ${updateError.message}` }, { status: 500 });
        }

        // 3. Log the change in points_history
        await adminClient.from('points_history').insert({
            user_id: userId,
            amount: difference,
            action: 'Admin Override',
            source: 'Admin Dashboard'
        });

        return NextResponse.json({
            success: true,
            message: `Impact updated from ${currentBalance} to ${newBalanceInput}`,
            newBalance: newBalanceInput,
            previousBalance: currentBalance
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
