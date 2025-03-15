import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/db/connection';
import { User } from '@/lib/types/user-types';

interface Session {
    user: User;
}

export async function getSession(): Promise<Session | null> {
    try {
        const cookiesStore = await cookies();
        const sessionToken = cookiesStore.get('session_token')?.value;
        
        if (!sessionToken) {
            return null;
        }

        const { db } = await connectToDatabase();
        const sessionPromise = db().collection('sessions')
            .findOne({ 
                token: sessionToken,
                expiresAt: { $gt: new Date() } // Only get non-expired sessions
            }, { 
                maxTimeMS: 5000 // 5 second timeout
            });

        const session = await Promise.race([
            sessionPromise,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Session query timeout')), 5000)
            )
        ]);
        
        if (!session) {
            return null;
        }

        // Get user data with timeout
        const userPromise = db().collection('users')
            .findOne({ _id: session.userId }, { 
                maxTimeMS: 5000 
            });

        const user = await Promise.race([
            userPromise,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('User query timeout')), 5000)
            )
        ]);
        
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