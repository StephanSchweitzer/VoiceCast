'use client';

/**
 * Component to provide proper spacing for the main content area
 * Accounts for the navbar height (64px / h-16)
 * No admin bar since it was removed from the top
 */
export default function LayoutSpacer({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-1 flex-col pt-16">
            {children}
        </div>
    );
}