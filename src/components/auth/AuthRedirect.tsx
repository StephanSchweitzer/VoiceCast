'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface AuthRedirectProps {
    children: React.ReactNode;
    redirectTo?: string;
}

export default function AuthRedirect({
                                         children,
                                         redirectTo = '/dashboard'
                                     }: AuthRedirectProps) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const hasRedirected = useRef(false);

    useEffect(() => {
        // Don't redirect while loading
        if (status === 'loading') return;

        // If user is authenticated and we haven't redirected yet
        if (status === 'authenticated' && session && !hasRedirected.current) {
            hasRedirected.current = true;

            // Try to get the 'from' parameter from URL, otherwise use default redirect
            const searchParams = new URLSearchParams(window.location.search);
            const from = searchParams.get('from');

            let destination = redirectTo;

            if (from) {
                try {
                    const decodedFrom = decodeURIComponent(from);
                    // Ensure it's an internal path (starts with /) and not a protocol-relative URL
                    if (decodedFrom.startsWith('/') && !decodedFrom.startsWith('//')) {
                        // Check if the 'from' URL is an auth page - if so, don't redirect back to it
                        const isAuthPage = decodedFrom.startsWith('/auth/') ||
                            decodedFrom === '/login' ||
                            decodedFrom === '/signin' ||
                            decodedFrom === '/register' ||
                            decodedFrom === '/signup';

                        if (!isAuthPage) {
                            destination = decodedFrom;
                        }
                        // If it is an auth page, we keep the default redirectTo destination
                    }
                } catch (e) {
                    // If decoding fails, use default redirect
                }
            }

            router.replace(destination);
        }
    }, [session, status, router, redirectTo]);

    // Reset redirect flag when status changes to unauthenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            hasRedirected.current = false;
        }
    }, [status]);

    // Show loading while checking auth status
    if (status === 'loading') {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    // If user is authenticated, don't render the auth form (they're being redirected)
    if (status === 'authenticated') {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="text-center space-y-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground">Redirecting...</p>
                </div>
            </div>
        );
    }

    // User is not authenticated, show the auth form
    return <>{children}</>;
}