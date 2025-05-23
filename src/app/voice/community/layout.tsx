import { ReactNode } from 'react';

interface LayoutProps {
    children: ReactNode;
}

export default function CommunityLayout({ children }: LayoutProps) {
    return (
        <div className="min-h-screen flex flex-col">
            <div className="flex flex-1 pt-16">
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}