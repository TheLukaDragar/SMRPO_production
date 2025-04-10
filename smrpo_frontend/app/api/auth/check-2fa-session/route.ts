import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/db/connection';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { verified: false, error: 'No session token found' }, 
        { status: 401 }
      );
    }

    // Connect to database and check session
    const { db } = await connectToDatabase();
    const session = await db().collection('sessions').findOne({ token: sessionToken });

    if (!session || new Date(session.expiresAt) < new Date()) {
      return NextResponse.json(
        { verified: false, error: 'Session invalid or expired' }, 
        { status: 401 }
      );
    }

    // Check if user has 2FA enabled but not verified
    const user = await db().collection('users').findOne({ _id: session.userId });
    
    if (!user) {
      return NextResponse.json(
        { verified: false, error: 'User not found' }, 
        { status: 404 }
      );
    }

    if (user.twoFactorEnabled && !session.twoFactorVerified) {
      return NextResponse.json({ verified: false });
    }

    return NextResponse.json({ verified: true });
  } catch (error) {
    console.error('Error checking 2FA session:', error);
    return NextResponse.json(
      { verified: false, error: 'Server error' }, 
      { status: 500 }
    );
  }
} 