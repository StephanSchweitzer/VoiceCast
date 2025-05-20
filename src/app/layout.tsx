// src/app/layout.tsx
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { ReactNode } from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'Voicecast - Create and Use Text-to-Speech Voices',
    description: 'A platform to create, manage, and use natural text-to-speech voices',
};

export default function RootLayout({
                                       children,
                                   }: {
    children: ReactNode;
}) {
    return (
        <html lang="en">
        <body className={`${inter.className} dark:bg-gray-900 dark:text-white`}>
        <ThemeProvider>
            <AuthProvider>
                <SidebarProvider>
                    <div className="flex h-screen flex-col">
                        <Navbar />
                        <div className="flex flex-1 overflow-hidden">
                            <Sidebar />
                            <main className="flex-1 overflow-y-auto p-4">
                                {children}
                            </main>
                        </div>
                    </div>
                </SidebarProvider>
            </AuthProvider>
        </ThemeProvider>
        </body>
        </html>
    );
}