'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import NProgress from 'nprogress';

// Configure NProgress
NProgress.configure({
    showSpinner: false,
    trickleSpeed: 200,
    minimum: 0.08,
    easing: 'ease',
    speed: 500,
});

function LoadingBarInner() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Start the progress bar
        NProgress.start();

        // Complete the progress bar after a short delay
        const timer = setTimeout(() => {
            NProgress.done();
        }, 100);

        return () => {
            clearTimeout(timer);
            NProgress.done();
        };
    }, [pathname, searchParams]);

    return null;
}

export default function LoadingBar() {
    return (
        <Suspense fallback={null}>
            <LoadingBarInner />
        </Suspense>
    );
}