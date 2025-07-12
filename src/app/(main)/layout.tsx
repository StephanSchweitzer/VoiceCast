import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import LayoutSpacer from '@/components/admin/LayoutSpacer';
import { ReactNode } from 'react';

export default function MainLayout({
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
                    {/* Main content */}
                    <main className="w-full">
                        <div className="p-4">
                            {children}
                        </div>
                    </main>
                </div>
            </LayoutSpacer>

            {/* Sidebar positioned absolutely or fixed */}
            <Sidebar />
        </div>
    );
}