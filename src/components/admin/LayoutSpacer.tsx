'use client';

import { useSession } from 'next-auth/react';
import { isUserAdmin } from '@/lib/utils/admin';

/**
 * Component to provide proper spacing for the main content area
 * Accounts for both the navbar and admin bar when present
 */
export default function LayoutSpacer({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const userIsAdmin = session ? isUserAdmin(session) : false;

    // Calculate top padding based on admin bar presence
    // Navbar = 64px (h-16), Admin bar = 40px (h-10)
    const topPadding = userIsAdmin ? 'pt-[104px]' : 'pt-16';

    return (
        <div className={`flex flex-1 flex-col ${topPadding}`}>
            {children}
        </div>
    );
}