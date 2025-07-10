'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useSidebar } from '@/contexts/SidebarContext';
import { useEffect } from 'react';
import { isUserAdmin } from '@/lib/utils/admin';
import { ChevronDown, ArrowRight } from 'lucide-react';

export default function Sidebar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const {
        isOpen,
        closeSidebar,
        voices,
        speakSessions,
        isLoading,
        isLoadingSessions,
        voicesCollapsed,
        speakSessionsCollapsed,
        toggleVoicesCollapsed,
        toggleSpeakSessionsCollapsed
    } = useSidebar();
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
        { href: '/speak', label: 'Speak' },
        { href: '/voice', label: 'Voices' },
    ];

    const adminNavItems = [
        { href: '/admin', label: 'Admin Dashboard', icon: '📊' },
        //{ href: '/admin/genres', label: 'Manage Genres', icon: '🏷️' },
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

    // Limit voices to 4 for display
    const displayedVoices = voices.slice(0, 4);
    const hasMoreVoices = voices.length > 4;

    // Limit speak sessions to 4 for display
    const displayedSessions = speakSessions.slice(0, 4);
    const hasMoreSessions = speakSessions.length > 4;

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
                className={`fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-30 ${topPadding} overflow-y-auto overscroll-contain transform transition-transform duration-300 ease-in-out ${
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
                                onClick={closeSidebar}
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

                {/* Speak Sessions Section */}
                {session && (
                    <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                        <div
                            className="flex items-center justify-between mb-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded px-2 py-1 -mx-2 transition-colors"
                            onClick={toggleSpeakSessionsCollapsed}
                        >
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Speak Sessions
                            </h3>
                            <div className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
                                <ChevronDown
                                    className={`w-3 h-3 text-gray-400 transition-transform duration-200 ease-in-out ${
                                        speakSessionsCollapsed ? 'rotate-180' : 'rotate-0'
                                    }`}
                                />
                            </div>
                        </div>

                        {/* Collapsible content with smooth transition */}
                        <div
                            className={`transition-all duration-300 ease-in-out overflow-hidden ${
                                speakSessionsCollapsed
                                    ? 'max-h-0 opacity-0'
                                    : 'max-h-96 opacity-100'
                            }`}
                        >
                            {isLoadingSessions ? (
                                <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                                    Loading sessions...
                                </div>
                            ) : displayedSessions.length > 0 ? (
                                <div className="space-y-1">
                                    {displayedSessions.map((session) => (
                                        <Link
                                            key={session.id}
                                            href={`/speak/session/${session.id}`}
                                            onClick={closeSidebar}
                                            className={`flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                                                pathname === `/speak/session/${session.id}`
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                                            }`}
                                        >
                                            <span className="truncate">{session.name}</span>
                                            {session._count.generatedAudios > 0 && (
                                                <span className="ml-2 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                                                    {session._count.generatedAudios}
                                                </span>
                                            )}
                                        </Link>
                                    ))}
                                    {hasMoreSessions && (
                                        <Link
                                            href="/speak/recent-sessions"
                                            onClick={closeSidebar}
                                            className="flex items-center justify-center px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                                        >
                                            <span>All sessions</span>
                                            <ArrowRight className="ml-1 w-3 h-3" />
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                    No sessions yet
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Voice Studio Section */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                    <div
                        className="flex items-center justify-between mb-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded px-2 py-1 -mx-2 transition-colors"
                        onClick={toggleVoicesCollapsed}
                    >
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Your Voice Library
                        </h3>
                        <div className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
                            <ChevronDown
                                className={`w-3 h-3 text-gray-400 transition-transform duration-200 ease-in-out ${
                                    voicesCollapsed ? 'rotate-180' : 'rotate-0'
                                }`}
                            />
                        </div>
                    </div>

                    {/* Collapsible content with smooth transition */}
                    <div
                        className={`transition-all duration-300 ease-in-out overflow-hidden ${
                            voicesCollapsed
                                ? 'max-h-0 opacity-0'
                                : 'max-h-96 opacity-100'
                        }`}
                    >
                        {session ? (
                            displayedVoices && displayedVoices.length > 0 ? (
                                <div className="space-y-1">
                                    {displayedVoices.map((voice) => (
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
                                    {hasMoreVoices && (
                                        <Link
                                            href="/voice"
                                            onClick={closeSidebar}
                                            className="flex items-center justify-center px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                                        >
                                            <span>View all voices</span>
                                            <ArrowRight className="ml-1 w-3 h-3" />
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                    No voices created yet
                                </p>
                            )
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                Sign in to view voices
                            </p>
                        )}
                    </div>
                </div>

                {/* Community Voices Section - Independent */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Community
                        </h3>
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

                {/* User actions for mobile */}
                <div className="mt-4 pt-4 md:hidden">
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