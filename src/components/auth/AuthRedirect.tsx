'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface AuthRedirectProps {
    children: React.ReactNode;
    redirectTo?: string;
}

export default function AuthRedirect({
                                         children,
                                         redirectTo = '/'
                                     }: AuthRedirectProps) {
    const { data: session, status } = useSession();
    const hasRedirected = useRef(false);

    useEffect(() => {
        // Don't redirect while loading
        if (status === 'loading') return;

        // If user is authenticated with a valid session and we haven't redirected yet
        if (status === 'authenticated' && session?.user && !hasRedirected.current) {
            // Double-check that we have essential session data (indicates valid JWT)
            const hasValidSession = session.user && (session.user.email || session.user.id);

            if (hasValidSession) {
                hasRedirected.current = true;
                // Use full page refresh to ensure server and client are completely in sync
                window.location.href = redirectTo;
            }
        }
    }, [session, status, redirectTo]);

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

    // If user is authenticated with valid session data, don't render the auth form
    if (status === 'authenticated' && session?.user) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="text-center space-y-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
                </div>
            </div>
        );
    }

    // User is not authenticated or session is invalid, show the auth form
    return <>{children}</>;
}