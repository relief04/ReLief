"use server";

import { createAdminClient } from '@/lib/supabaseAdmin';
import { auth } from '@clerk/nextjs/server';
import { checkAndAwardBadges } from '@/lib/badgesServer';

export async function createGroupAction(newGroup: any) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: "Unauthorized: You must be signed in." };

        const adminSupabase = createAdminClient();

        const { data: groupData, error: groupError } = await adminSupabase
            .from('groups')
            .insert([{
                name: newGroup.name,
                description: newGroup.description,
                group_type: newGroup.group_type,
                is_private: newGroup.is_private,
                created_by: userId,
                member_count: 1,
                avatar_url: null
            }])
            .select()
            .single();

        if (groupError || !groupData) throw groupError || new Error("No data returned during insertion");

        const { error: memberError } = await adminSupabase
            .from('group_members')
            .insert([{
                group_id: groupData.id,
                user_id: userId,
                role: 'admin'
            }]);

        if (memberError) throw memberError;

        // Check for badges on the server
        await checkAndAwardBadges(userId);

        return { success: true, groupData };
    } catch (e: any) {
        console.error("Server Action createGroupAction Error:", e);
        return { success: false, error: e.message || 'Unknown error' };
    }
}

export async function updateGroupAction(groupId: string, updateData: any) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: "Unauthorized" };

        const adminSupabase = createAdminClient();

        // Ensure user is the creator before allowing update
        const { data: existingGroup } = await adminSupabase
            .from('groups')
            .select('created_by')
            .eq('id', groupId)
            .single();

        if (existingGroup?.created_by !== userId) {
            return { success: false, error: "Unauthorized: You are not the creator of this group." };
        }

        const { error: updateError } = await adminSupabase
            .from('groups')
            .update({
                name: updateData.name,
                description: updateData.description,
                group_type: updateData.group_type,
                is_private: updateData.is_private,
            })
            .eq('id', groupId)
            .eq('created_by', userId);

        if (updateError) throw updateError;
        return { success: true };
    } catch (e: any) {
        console.error("Server Action updateGroupAction Error:", e);
        return { success: false, error: e.message || 'Unknown error' };
    }
}

export async function deleteGroupAction(groupId: string) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: "Unauthorized" };

        const adminSupabase = createAdminClient();

        // Ensure user is the creator
        const { data: existingGroup } = await adminSupabase
            .from('groups')
            .select('created_by')
            .eq('id', groupId)
            .single();

        if (existingGroup?.created_by !== userId) {
            return { success: false, error: "Unauthorized to delete this group" };
        }

        const { error } = await adminSupabase
            .from('groups')
            .delete()
            .eq('id', groupId)
            .eq('created_by', userId);

        if (error) throw error;
        return { success: true };
    } catch (e: any) {
        console.error("Server Action deleteGroupAction Error:", e);
        return { success: false, error: e.message || 'Unknown error' };
    }
}

export async function joinGroupAction(groupId: string) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: "Unauthorized" };

        const adminSupabase = createAdminClient();

        const { data: existingGroup } = await adminSupabase
            .from('groups')
            .select('created_by')
            .eq('id', groupId)
            .single();

        const roleToAssign = existingGroup?.created_by === userId ? 'admin' : 'member';

        const { error } = await adminSupabase
            .from('group_members')
            .insert({
                group_id: groupId,
                user_id: userId,
                role: roleToAssign
            });

        if (error) throw error;

        await adminSupabase.rpc('increment_group_member_count', { group_id_param: groupId });

        // Check for badges
        await checkAndAwardBadges(userId);

        return { success: true, role: roleToAssign };
    } catch (e: any) {
        console.error("Server Action joinGroupAction Error:", e);
        return { success: false, error: e.message || 'Unknown error' };
    }
}

export async function leaveGroupAction(groupId: string) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: "Unauthorized" };

        const adminSupabase = createAdminClient();

        // If user is admin, try to promote someone else
        const { data: myMembership } = await adminSupabase
            .from('group_members')
            .select('role')
            .eq('group_id', groupId)
            .eq('user_id', userId)
            .single();

        if (myMembership?.role === 'admin') {
            const { data: otherMembers } = await adminSupabase
                .from('group_members')
                .select('user_id')
                .eq('group_id', groupId)
                .neq('user_id', userId)
                .limit(1);

            if (otherMembers && otherMembers.length > 0) {
                await adminSupabase
                    .from('group_members')
                    .update({ role: 'admin' })
                    .eq('group_id', groupId)
                    .eq('user_id', otherMembers[0].user_id);
            }
        }

        const { error } = await adminSupabase
            .from('group_members')
            .delete()
            .eq('group_id', groupId)
            .eq('user_id', userId);

        if (error) throw error;

        // Technically should decrement count here, but rely on DB trigger/RPC later if needed.
        // Actually best to keep it in sync since there is an increment rpc
        await adminSupabase.rpc('decrement_group_member_count', { group_id_param: groupId });

        return { success: true };
    } catch (e: any) {
        console.error("Server Action leaveGroupAction Error:", e);
        return { success: false, error: e.message || 'Unknown error' };
    }
}
