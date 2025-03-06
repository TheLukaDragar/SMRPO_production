import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/db/connection';
import { User } from '@/lib/types/user-types';

interface Session {
    user: User;
}

export async function getSession(): Promise<Session | null> {
    try {
        const sessionToken = cookies().get('session_token')?.value;
        
        if (!sessionToken) {
            return null;
        }

        const { db } = await connectToDatabase();
        const session = await db().collection('sessions').findOne({ token: sessionToken });
        
        if (!session) {
            return null;
        }

        // Get user data
        const user = await db().collection('users').findOne({ _id: session.userId });
        
        if (!user) {
            return null;
        }

        return {
            user: JSON.parse(JSON.stringify(user))
        };
    } catch (error) {
        console.error('Error getting session:', error);
        return null;
    }
}

export async function createSession(userId: string): Promise<string> {
    const { db } = await connectToDatabase();
    const token = generateSessionToken();
    
    await db().collection('sessions').insertOne({
        token,
        userId,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    return token;
}

function generateSessionToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
} 