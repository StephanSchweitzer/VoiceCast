import { ReactNode } from 'react';

export const metadata = {
    title: 'Voicecast - Authentication',
    description: 'Sign in or create your Voicecast account',
};

export default function AuthLayout({
                                       children,
                                   }: {
    children: ReactNode;
}) {
    return (
        <div className="h-full bg-gradient-to-br from-background via-background to-muted/20">
            {children}
        </div>
    );
}