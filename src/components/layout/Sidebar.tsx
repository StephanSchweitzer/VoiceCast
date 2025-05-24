'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useSidebar } from '@/contexts/SidebarContext';
import { useEffect } from 'react';
import { isUserAdmin } from '@/lib/utils/admin';

export default function Sidebar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const { isOpen, closeSidebar, voices } = useSidebar();
    const userIsAdmin = session ? isUserAdmin(session) : false;

    // Handle escape key to close sidebar
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                closeSidebar();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, closeSidebar]);

    const mainNavItems = [
        { href: '/', label: 'Home' },
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/voice', label: 'Voices' },
    ];

    const adminNavItems = [
        { href: '/admin', label: 'Admin Dashboard', icon: '📊' },
        { href: '/admin/genres', label: 'Manage Genres', icon: '🏷️' },
        // Add more admin items here as you build them
        // { href: '/admin/voices', label: 'Manage Voices', icon: '🎤' },
        // { href: '/admin/users', label: 'Manage Users', icon: '👥' },
    ];

    const isActiveLink = (href: string) => {
        if (href === '/') {
            return pathname === '/';
        }
        return pathname.startsWith(href);
    };

    // Calculate top padding based on admin bar presence
    const topPadding = userIsAdmin ? 'pt-26' : 'pt-16'; // pt-26 = 6.5rem (64px + 40px)

    return (
        <>
            {/* Overlay/backdrop that appears when sidebar is open on mobile */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
                    onClick={closeSidebar}
                />
            )}

            {/* Sidebar - with smooth transition for sliding */}
            <aside
                className={`fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-30 ${topPadding} overflow-y-auto transform transition-transform duration-300 ease-in-out ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {/* Admin Section - Only visible to admins */}
                {userIsAdmin && (
                    <div className="p-4 border-b border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300 mb-3">
                            Admin Panel
                        </h3>
                        <nav className="space-y-1">
                            {adminNavItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={closeSidebar}
                                    className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                                        isActiveLink(item.href)
                                            ? 'bg-blue-100 dark:bg-blue-800/50 text-blue-800 dark:text-blue-200 font-medium'
                                            : 'text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/30 hover:text-blue-900 dark:hover:text-blue-100'
                                    }`}
                                >
                                    <span className="mr-2">{item.icon}</span>
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                )}

                {/* Main Navigation Section */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                        Navigation
                    </h3>
                    <nav className="space-y-1">
                        {mainNavItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={closeSidebar} // Close sidebar when navigating on mobile
                                className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                                    isActiveLink(item.href)
                                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Voice Management Section */}
                <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Voice Studio
                        </h3>
                    </div>

                    <Link
                        href="/voice/new"
                        onClick={closeSidebar}
                        className="flex w-full items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors mb-4"
                    >
                        Create New Voice
                    </Link>

                    {session ? (
                        voices && voices.length > 0 ? (
                            <div className="space-y-1">
                                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                                    Your Voices
                                </div>
                                {voices.map((voice) => (
                                    <Link
                                        key={voice.id}
                                        href={`/voice/${voice.id}`}
                                        onClick={closeSidebar}
                                        className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                                            pathname === `/voice/${voice.id}`
                                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                    >
                                        <span className="truncate">{voice.name}</span>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                No voices created yet
                            </p>
                        )
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                            Sign in to create voices
                        </p>
                    )}

                    {/* Community Voices */}
                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                            Community
                        </div>
                        <Link
                            href="/voice/community"
                            onClick={closeSidebar}
                            className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                                pathname === '/voice/community'
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            Browse Community Voices
                        </Link>
                    </div>
                </div>

                {/* User actions for mobile */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 md:hidden">
                    {session ? (
                        <div className="space-y-2">
                            <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                                Signed in as{' '}
                                <span className="font-medium">
                                    {session.user.name || session.user.email}
                                </span>
                                {userIsAdmin && (
                                    <span className="ml-2 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full">
                                        Admin
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    signOut();
                                    closeSidebar();
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white rounded-md transition-colors"
                            >
                                Sign out
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Link
                                href="/auth/login"
                                onClick={closeSidebar}
                                className="block w-full text-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white rounded-md transition-colors"
                            >
                                Sign in
                            </Link>
                            <Link
                                href="/auth/register"
                                onClick={closeSidebar}
                                className="block w-full text-center px-3 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
                            >
                                Sign up
                            </Link>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}