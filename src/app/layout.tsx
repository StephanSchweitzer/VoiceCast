import { Inter } from 'next/font/google';
import './styles/main.css';
import './styles/theme.css';
import './styles/nprogress.css';
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
        <html lang="en" suppressHydrationWarning className="h-full">
        <body className={`${inter.className} dark:bg-gray-900 dark:text-white`}>
        <ThemeProvider>
            <AuthProvider>
                <SidebarProvider>
                    <LoadingBar />
                    {children}
                    <Toaster richColors position="top-center" />
                </SidebarProvider>
            </AuthProvider>
        </ThemeProvider>
        </body>
        </html>
    );
}