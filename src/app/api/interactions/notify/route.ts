import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { sendCommunityInteractionEmail } from '@/lib/email';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { postId, actorId, actionType } = body;

        if (!postId || !actorId || !actionType) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Fetch the post to get the recipient's user_id and content
        const { data: post, error: postError } = await supabase
            .from('posts')
            .select('user_id, content')
            .eq('id', postId)
            .single();

        if (postError || !post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        // Don't email them if they liked their own post
        if (post.user_id === actorId) {
            return NextResponse.json({ success: true, message: 'Self-interaction ignored' });
        }

        // 2. Fetch Recipient Profile to get their email
        const { data: recipientProfile, error: recipientError } = await supabase
            .from('profiles')
            .select('email, username')
            .eq('id', post.user_id)
            .single();

        if (recipientError || !recipientProfile || !recipientProfile.email) {
            return NextResponse.json({ error: 'Recipient not found or has no email' }, { status: 404 });
        }

        // 3. Fetch Actor Profile to get their name
        const { data: actorProfile, error: actorError } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', actorId)
            .single();

        const actorName = !actorError && actorProfile?.username ? actorProfile.username : 'Someone';
        const recipientName = recipientProfile.username || 'Eco Warrior';

        // 4. Dispatch the email
        await sendCommunityInteractionEmail(
            recipientProfile.email,
            recipientName,
            actorName,
            actionType as 'like' | 'comment',
            post.content
        );

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error handling interaction email:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
