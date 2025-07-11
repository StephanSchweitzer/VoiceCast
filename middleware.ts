import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

export async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;

    // Allow these paths without authentication
    if (path === '/' || path === '/auth/login' || path === '/auth/register') {
        return NextResponse.next();
    }

    // Check for session token with more robust error handling
    let session;
    try {
        session = await getToken({
            req,
            secret: process.env.NEXTAUTH_SECRET,
            // Add some additional token sources for better reliability
            secureCookie: process.env.NODE_ENV === 'production',
        });
    } catch (error) {
        console.error('Token validation error:', error);
        session = null;
    }

    // Protected routes that require authentication
    if (!session && (path.includes('/dashboard') || path.includes('/voice'))) {
        // Check if this request is coming from an auth redirect loop
        const referer = req.headers.get('referer');
        const fromParam = req.nextUrl.searchParams.get('from');
        const isFromAuthPage = referer && (
            referer.includes('/auth/login') ||
            referer.includes('/auth/register')
        );

        // If coming from auth page OR if we're in a potential loop, redirect to homepage
        if (isFromAuthPage || fromParam === path) {
            return NextResponse.redirect(new URL('/', req.url));
        }

        // Otherwise, normal auth redirect with from parameter
        const loginUrl = new URL('/auth/login', req.url);
        loginUrl.searchParams.set('from', path);
        return NextResponse.redirect(loginUrl);
    }

    // Voice access control (only if authenticated)
    if (session && path.match(/\/voice\/[^/]+$/)) {
        const voiceId = path.split('/').pop();

        if (voiceId) {
            try {
                const voice = await prisma.voice.findUnique({
                    where: { id: voiceId },
                    select: {
                        id: true,
                        userId: true,
                        isPublic: true
                    }
                });

                // If voice doesn't exist, let the page handle the 404
                if (!voice) {
                    return NextResponse.next();
                }

                // Check if user has access (owns the voice OR it's public)
                const hasAccess = voice.userId === session.sub || voice.isPublic;

                if (!hasAccess) {
                    // Redirect to dashboard with error message
                    const dashboardUrl = new URL('/dashboard', req.url);
                    dashboardUrl.searchParams.set('error', 'unauthorized');
                    return NextResponse.redirect(dashboardUrl);
                }
            } catch (error) {
                console.error('Middleware voice check error:', error);
                // On error, let the request continue and let API handle it
                return NextResponse.next();
            }
        }
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