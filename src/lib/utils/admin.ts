import { Session } from 'next-auth';

/**
 * Check if a user session has admin privileges
 * @param session - NextAuth session object
 * @returns boolean indicating if user is admin
 */
export function isUserAdmin(session: Session | null): boolean {
    if (!session?.user) {
        return false;
    }

    // Check both isAdmin flag and role for redundancy
    return session.user.isAdmin === true || session.user.role === 'admin';
}

/**
 * Middleware helper to check admin access
 * Throws an error if user is not admin
 * @param session - NextAuth session object
 * @throws Error if user is not admin or not authenticated
 */
export function requireAdmin(session: Session | null): void {
    if (!session) {
        throw new Error('Authentication required');
    }

    if (!isUserAdmin(session)) {
        throw new Error('Admin access required');
    }
}

/**
 * Get user role from session
 * @param session - NextAuth session object
 * @returns user role string or 'user' as default
 */
export function getUserRole(session: Session | null): string {
    return session?.user?.role || 'user';
}