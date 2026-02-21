import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userIds } = await req.json();

        if (!userIds || !Array.isArray(userIds)) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        const client = await clerkClient();

        // Fetch users from Clerk
        const users = await Promise.all(
            userIds.map(async (id: string) => {
                try {
                    const user = await client.users.getUser(id);
                    return {
                        id: user.id,
                        username: user.username || user.firstName || 'User',
                        firstName: user.firstName,
                        lastName: user.lastName,
                        imageUrl: user.imageUrl
                    };
                } catch (error) {
                    console.error(`Error fetching user ${id}:`, error);
                    return {
                        id,
                        username: 'User',
                        firstName: null,
                        lastName: null,
                        imageUrl: null
                    };
                }
            })
        );

        return NextResponse.json(users);
    } catch (error) {
        console.error('Error in batch users API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
