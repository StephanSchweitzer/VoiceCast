import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import LayoutSpacer from '@/components/admin/LayoutSpacer';
import { ReactNode } from 'react';

export default function FullscreenLayout({
                                             children,
                                         }: {
    children: ReactNode;
}) {
    return (
        <div className="min-h-screen">
            <Navbar />

            {/* Container that takes remaining space after navbar */}
            <LayoutSpacer>
                <div className="w-full">
                    {/* Main content with minimal side/top padding */}
                    <main className="w-full px-4 pt-1">
                        {children}
                    </main>
                </div>
            </LayoutSpacer>

            {/* Sidebar positioned absolutely or fixed */}
            <Sidebar />
        </div>
    );
}