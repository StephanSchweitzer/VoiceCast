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
            {/* Admin Navigation Bar - Only visible to admins */}
            {userIsAdmin && (
                <div className="bg-blue-600 dark:bg-blue-700 text-white fixed top-0 left-0 right-0 z-50">
                    <div className="mx-auto px-4">
                        <div className="flex items-center justify-between h-10">
                            <div className="flex items-center space-x-4">
                                <span className="text-xs font-medium">Admin Panel:</span>
                                <Link
                                    href="/admin"
                                    className="text-xs hover:text-blue-200 transition-colors"
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    href="/admin/genres"
                                    className="text-xs hover:text-blue-200 transition-colors"
                                >
                                    Manage Genres
                                </Link>
                                {/* Add more admin links here as you build them */}
                            </div>
                            <div className="text-xs text-blue-200">
                                Admin Mode: {session?.user?.name || session?.user?.email}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Navigation Bar */}
            <nav className={`bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 fixed left-0 right-0 z-40 ${userIsAdmin ? 'top-10' : 'top-0'}`}>
                <div className="mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        {/* Left section with hamburger menu button and logo */}
                        <div className="flex items-center">
                            <SidebarToggle />
                            <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white ml-3">
                                Voicecast
                            </Link>
                        </div>

                        {/* Center section with navigation links - only shown on desktop */}
                        <div className="hidden md:flex">
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
                                    href="/voice"
                                    className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Voices
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

                        {/* Right section with theme toggle and user actions */}
                        <div className="flex items-center space-x-4">
                            <ThemeToggle />

                            {session ? (
                                <div className="flex items-center">
                                    <div className="hidden sm:flex sm:items-center sm:mr-2">
                                        <span className="text-gray-600 dark:text-gray-300 text-sm">
                                            {session.user.name || session.user.email}
                                        </span>
                                        {userIsAdmin && (
                                            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full">
                                                Admin
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => signOut()}
                                        className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                                    >
                                        Sign out
                                    </button>
                                </div>
                            ) : (
                                <div className="flex space-x-2">
                                    <Link
                                        href="/auth/login"
                                        className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                                    >
                                        Sign in
                                    </Link>
                                    <Link
                                        href="/auth/register"
                                        className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                                    >
                                        Sign up
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
        </>
    );
}