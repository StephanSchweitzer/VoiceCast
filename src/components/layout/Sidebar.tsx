'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useSidebar } from '@/contexts/SidebarContext';
import { useEffect } from 'react';

export default function Sidebar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const { isOpen, closeSidebar, voices } = useSidebar();

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
                className={`fixed left-0 top-0 h-full w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-30 pt-16 overflow-y-auto transform transition-transform duration-300 ease-in-out ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="p-4">
                    <Link
                        href="/voice/new"
                        className="flex w-full items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                        New Voice
                    </Link>
                </div>

                <div className="mt-2">
                    <div className="px-4 py-2">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            YOUR VOICES
                        </h3>
                    </div>
                    {session ? (
                        voices && voices.length > 0 ? (
                            <nav className="mt-1 px-2">
                                {voices.map((voice) => (
                                    <Link
                                        key={voice.id}
                                        href={`/voice/${voice.id}`}
                                        className={`flex items-center px-2 py-2 text-sm rounded-md ${
                                            pathname === `/voice/${voice.id}`
                                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                    >
                                        {voice.name}
                                    </Link>
                                ))}
                            </nav>
                        ) : (
                            <p className="px-4 text-sm text-gray-500 dark:text-gray-400">
                                No voices created yet
                            </p>
                        )
                    ) : (
                        <p className="px-4 text-sm text-gray-500 dark:text-gray-400">
                            Sign in to create voices
                        </p>
                    )}
                    <div className="px-2 mt-2">
                        <Link
                            href="/voice"
                            className={`flex items-center px-2 py-2 text-sm rounded-md ${
                                pathname === '/voice'
                                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            All Voices
                        </Link>
                    </div>
                </div>

                <div className="mt-6">
                    <div className="px-4 py-2">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            COMMUNITY VOICES
                        </h3>
                    </div>
                    <nav className="mt-1 px-2">
                        <Link
                            href="/voice/community"
                            className={`flex items-center px-2 py-2 text-sm rounded-md ${
                                pathname === '/voice/community'
                                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            Browse Voices
                        </Link>
                    </nav>
                </div>
            </aside>
        </>
    );
}