'use client';
import { ReactNode } from 'react';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import { SidebarProvider } from '@/contexts/SidebarContext';

interface LayoutProps {
    children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    return (
        <SidebarProvider>
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <div className="flex flex-1 pt-16">
                    <Sidebar />
                    <main className="flex-1 overflow-y-auto">
                        {children}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}