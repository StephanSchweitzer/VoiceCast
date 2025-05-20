// src/components/layout/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useSidebar } from '@/contexts/SidebarContext';

// Component that renders a nav item
const NavItem = ({ href, isActive, children }) => (
    <Link
        href={href}
        className={`block rounded-md px-3 py-2 text-sm ${
            isActive
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
    >
        {children}
    </Link>
);

export default function Sidebar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const { isOpen, voices } = useSidebar();

    if (!isOpen) {
        return (
            <div className="w-0 transition-width duration-300 ease-in-out overflow-hidden" />
        );
    }

    return (
        <div className="w-64 bg-gray-100 dark:bg-gray-800 transition-width duration-300 ease-in-out overflow-y-auto">
            <div className="px-4 py-5">
                <Link
                    href={session ? "/voice/new" : "/login"}
                    className="flex w-full items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                    New Voice
                </Link>
            </div>

            {session ? (
                <div className="px-2 py-4">
                    <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Your Voices
                    </h3>
                    {voices.length > 0 ? (
                        <ul className="space-y-1">
                            {voices.map((voice) => (
                                <li key={voice.id}>
                                    <NavItem
                                        href={`/voice/${voice.id}`}
                                        isActive={pathname === `/voice/${voice.id}`}
                                    >
                                        {voice.name}
                                    </NavItem>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="px-2 text-sm text-gray-500 dark:text-gray-400">
                            No voices created yet
                        </p>
                    )}
                </div>
            ) : (
                <div className="px-4 py-6 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Sign in to create and manage your voices
                    </p>
                    <div className="mt-4 space-y-2">
                        <Link
                            href="/login"
                            className="block w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-center text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/register"
                            className="block w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-center text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            Register
                        </Link>
                    </div>
                </div>
            )}

            <div className="px-2 py-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Community Voices
                </h3>
                <NavItem
                    href="/voice/community"
                    isActive={pathname === '/voice/community'}
                >
                    Browse Voices
                </NavItem>
            </div>
        </div>
    );
}