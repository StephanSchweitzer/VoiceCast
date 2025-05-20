'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useSidebar } from '@/contexts/SidebarContext';

// Extract navigation link component
type NavLinkProps = {
    href: string;
    children: React.ReactNode;
};

const NavLink = ({ href, children }: NavLinkProps) => (
    <Link
        href={href}
        className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
    >
        {children}
    </Link>
);

// Extract auth button component
type AuthButtonProps = {
    variant: 'primary' | 'secondary';
    href?: string;
    onClick?: () => void;
    children: React.ReactNode;
};

const AuthButton = ({ variant, href, onClick, children }: AuthButtonProps) => {
    const baseClasses = "rounded-md px-3 py-2 text-sm font-medium transition-colors";
    const variantClasses = variant === 'primary'
        ? "bg-blue-600 text-white hover:bg-blue-700"
        : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600";

    const className = `${baseClasses} ${variantClasses}`;

    return href ? (
        <Link href={href} className={className}>{children}</Link>
    ) : (
        <button onClick={onClick} className={className}>{children}</button>
    );
};

export default function Navbar() {
    const { data: session, status } = useSession();
    const isLoading = status === 'loading';
    const { isOpen, toggleSidebar } = useSidebar();

    const navLinks = [
        { href: '/', label: 'Home' },
        { href: '/dashboard', label: 'Dashboard' }
    ];

    return (
        <header className="bg-white dark:bg-gray-800 shadow-sm">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 justify-between">
                    {/* Logo and Navigation */}
                    <div className="flex">
                        <div className="flex flex-shrink-0 items-center">
                            <button
                                onClick={toggleSidebar}
                                className="mr-4 p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                                aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                            <Link href="/" className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                Voicecast
                            </Link>
                        </div>
                        <nav className="ml-6 hidden md:flex md:space-x-8">
                            {navLinks.map(link => (
                                <NavLink key={link.href} href={link.href}>
                                    {link.label}
                                </NavLink>
                            ))}
                        </nav>
                    </div>

                    {/* User Actions */}
                    <div className="flex items-center space-x-4">
                        <ThemeToggle />

                        {isLoading ? (
                            <div className="h-8 w-20 animate-pulse bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                        ) : session ? (
                            <AuthenticatedUser
                                name={session.user.name || session.user.email || 'User'}
                                onSignOut={() => signOut()}
                            />
                        ) : (
                            <GuestActions />
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}

// Extract user interface components
function AuthenticatedUser({ name, onSignOut }: { name: string; onSignOut: () => void }) {
    return (
        <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700 dark:text-gray-300">{name}</span>
            <AuthButton variant="secondary" onClick={onSignOut}>
                Sign out
            </AuthButton>
        </div>
    );
}

function GuestActions() {
    return (
        <div className="flex items-center gap-4">
            <AuthButton variant="secondary" href="/login">
                Sign in
            </AuthButton>
            <AuthButton variant="primary" href="/register">
                Sign up
            </AuthButton>
        </div>
    );
}