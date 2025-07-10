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
            {/* Admin Navigation Bar - Hidden on mobile, full bar on desktop */}
            {userIsAdmin && (
                <>
                    {/* Desktop Admin Bar */}
                    <div className="hidden md:block bg-blue-600 dark:bg-blue-700 text-white fixed top-0 left-0 right-0 z-50">
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
                                </div>
                                <div className="text-xs text-blue-200">
                                    Admin Mode: {session?.user?.name || session?.user?.email}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Admin Indicator - Thin line */}
                    <div className="md:hidden bg-blue-600 dark:bg-blue-700 text-white fixed top-0 left-0 right-0 z-50">
                        <div className="flex items-center justify-center h-6">
                            <Link
                                href="/admin"
                                className="text-xs font-medium hover:text-blue-200 transition-colors"
                            >
                                ⚡ Admin Mode
                            </Link>
                        </div>
                    </div>
                </>
            )}

            {/* Main Navigation Bar */}
            <nav className={`bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 fixed left-0 right-0 z-40 ${
                userIsAdmin
                    ? 'top-10 md:top-10 top-6' // Different heights for mobile vs desktop when admin
                    : 'top-0'
            }`}>
                <div className="mx-auto px-4">
                    <div className="grid grid-cols-3 items-center h-16">
                        {/* Left section */}
                        <div className="flex items-center justify-start">
                            <SidebarToggle />
                            <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white ml-3">
                                Voicecast
                            </Link>
                            {/* Mobile Admin Badge */}
                            {userIsAdmin && (
                                <div className="md:hidden ml-3">
                                    <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full">
                                        Admin
                                    </span>
                                </div>
                            )}
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

                        {/* Right section */}
                        <div className="flex items-center justify-end space-x-4">
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