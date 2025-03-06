import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

export async function GET() {
    try {
        const session = await getSession();
        return NextResponse.json(session || { user: null });
    } catch (error) {
        console.error('Error getting session:', error);
        return NextResponse.json({ user: null }, { status: 500 });
    }
} 