'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import SidebarToggle from '@/components/ui/SidebarToggle';
import { isUserAdmin } from '@/lib/utils/admin';

export default function Navbar() {
    const { data: session } = useSession();
    const userIsAdmin = session ? isUserAdmin(session) : false;

    return (
        <>
            {/* Main Navigation Bar */}
            <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 fixed top-0 left-0 right-0 z-40">
                <div className="mx-auto px-4">
                    <div className="flex md:grid md:grid-cols-3 items-center justify-between md:justify-normal h-16">
                        <div className="flex items-center md:justify-start">
                            <div className="-ml-1 md:ml-0">
                                <SidebarToggle />
                            </div>
                            <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white ml-2 md:ml-3">
                                Voicecast
                            </Link>
                        </div>

                        {/* Center section - truly centered */}
                        <div className="hidden md:flex justify-center">
                            <div className="flex space-x-4">
                                <Link
                                    href="/"
                                    className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Home
                                </Link>
                                <Link
                                    href="/dashboard"
                                    className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    href="/speak"
                                    className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Speak
                                </Link>
                                <Link
                                    href="/voice"
                                    className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Voices
                                </Link>
                                <Link
                                    href="/voice/community"
                                    className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Community
                                </Link>
                                {/* Admin link in main nav for desktop */}
                                {userIsAdmin && (
                                    <Link
                                        href="/admin"
                                        className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300 px-3 py-2 rounded-md text-sm font-medium border border-blue-200 dark:border-blue-600"
                                    >
                                        Admin
                                    </Link>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center space-x-4 md:justify-end">
                            <ThemeToggle />

                            {session ? (
                                <div className="flex items-center">
                                    <div className="hidden sm:flex sm:items-center sm:mr-2">
                                        <span className="text-gray-600 dark:text-gray-300 text-sm">
                                            {session.user.name || session.user.email}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => signOut()}
                                        className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                                    >
                                        Sign out
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    href="/auth/login"
                                    className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                                >
                                    Sign in
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
        </>
    );
}