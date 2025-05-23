import { Inter } from 'next/font/google';
import './styles/main.css';
import './styles/theme.css';
import './styles/nprogress.css';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { Toaster } from 'sonner';
import { ReactNode } from 'react';
import LoadingBar from '@/components/ui/LoadingBar';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'Voicecast - Create and Use Text-to-Speech Voices',
    description: 'A platform to create, manage, and use natural text-to-speech voices',
    icons: {
        icon: '/favicon.ico',
    },
};

export default function RootLayout({
                                       children,
                                   }: {
    children: ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body className={`${inter.className} dark:bg-gray-900 dark:text-white`}>
        <ThemeProvider>
            <AuthProvider>
                <SidebarProvider>
                    <LoadingBar />
                    <div className="flex h-screen flex-col">
                        <Navbar />
                        {/* Add top padding to account for fixed navbar */}
                        <div className="flex flex-1 overflow-hidden mt-16">
                            {/* Main content takes full width with proper padding */}
                            <main className="w-full flex-1 overflow-y-auto p-4">
                                {children}
                            </main>
                        </div>
                        {/* Sidebar is rendered outside the main layout flow */}
                        <Sidebar />
                    </div>
                    <Toaster richColors position="top-center" />
                </SidebarProvider>
            </AuthProvider>
        </ThemeProvider>
        </body>
        </html>
    );
}