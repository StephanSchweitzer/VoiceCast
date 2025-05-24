'use client';

import { useEffect } from 'react';
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

    useEffect(() => {
        // Don't redirect while loading
        if (status === 'loading') return;

        // If user is authenticated, redirect them away from auth pages
        if (status === 'authenticated' && session) {
            // Try to get the 'from' parameter from URL, otherwise use default redirect
            const searchParams = new URLSearchParams(window.location.search);
            const from = searchParams.get('from');

            let destination = redirectTo;

            if (from) {
                try {
                    const decodedFrom = decodeURIComponent(from);
                    // Ensure it's an internal path (starts with /) and not a protocol-relative URL
                    if (decodedFrom.startsWith('/') && !decodedFrom.startsWith('//')) {
                        destination = decodedFrom;
                    }
                } catch (e) {
                    // If decoding fails, use default redirect
                }
            }

            router.replace(destination);
        }
    }, [session, status, router, redirectTo]);

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