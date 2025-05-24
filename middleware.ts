import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    // Get the pathname of the request
    const path = req.nextUrl.pathname;

    // If it's the homepage, login, or register page, don't do anything
    if (path === '/' || path === '/auth/login' || path === '/auth/register') {
        return NextResponse.next();
    }

    const session = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
    });

    // If the user is not signed in and is trying to access a protected route, redirect to the login page
    if (!session && (path.includes('/dashboard') || path.includes('/voice'))) {
        return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    // If the user is signed in and is trying to access a voice route, check if the voice belongs to them
    if (session && path.match(/\/voice\/[^/]+$/)) {
        const voiceId = path.split('/').pop();

        // This would need to be replaced with actual verification logic
        // For now, we're just redirecting back to dashboard if there's an issue
        // In a real app, you would check if the voice belongs to the user

        // Mock check - this would be replaced with a DB call
        // const hasAccess = await checkVoiceAccess(session.user.id, voiceId);
        // if (!hasAccess) {
        //   return NextResponse.redirect(new URL('/dashboard', req.url));
        // }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};