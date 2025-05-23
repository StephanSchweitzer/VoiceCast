'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useSidebar } from '@/contexts/SidebarContext';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import SidebarToggle from '@/components/ui/SidebarToggle';

export default function Navbar() {
    const { data: session } = useSession();

    return (
        <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 fixed top-0 left-0 right-0 z-40">
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
                        </div>
                    </div>

                    {/* Right section with theme toggle and user actions */}
                    <div className="flex items-center space-x-4">
                        <ThemeToggle />

                        {session ? (
                            <div className="flex items-center">
                                <span className="hidden sm:block text-gray-600 dark:text-gray-300 text-sm mr-2">
                                    {session.user.name || session.user.email}
                                </span>
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
                                    href="/login"
                                    className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    href="/register"
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
    );
}