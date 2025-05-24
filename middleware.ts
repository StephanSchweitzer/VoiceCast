import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

export async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;

    if (path === '/' || path === '/auth/login' || path === '/auth/register') {
        return NextResponse.next();
    }

    const session = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session && (path.includes('/dashboard') || path.includes('/voice'))) {
        const loginUrl = new URL('/auth/login', req.url);
        loginUrl.searchParams.set('from', path);
        return NextResponse.redirect(loginUrl);
    }

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