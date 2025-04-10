import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = ['/login', '/register', '/verify-2fa'];

export async function middleware(request: NextRequest) {
    const sessionToken = request.cookies.get('session_token')?.value;
    const pathname = request.nextUrl.pathname;

    // Public routes that don't need authentication
    if (
        pathname.startsWith('/_next') || 
        pathname.startsWith('/api') || 
        publicRoutes.includes(pathname)
    ) {
        return NextResponse.next();
    }

    // If no session token, redirect to login
    if (!sessionToken) {
        const url = new URL('/login', request.url);
        url.searchParams.set('from', pathname);
        return NextResponse.redirect(url);
    }

    // Since we can't access MongoDB in Edge runtime, we'll handle 2FA in the page components
    // or through API routes. This middleware just checks if the session token exists.
    
    return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}; 