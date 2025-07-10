import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import SpeakClient from './SpeakClient';

interface SpeakPageProps {
    searchParams: Promise<{ session?: string }>;
}

export default async function SpeakPage({ searchParams }: SpeakPageProps) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/auth/login');
    }

    const { session: sessionId } = await searchParams;

    return (
        // Remove the p-4 wrapper by using a full-width container
        <div className="w-full h-full">
            <div className="w-full max-w-4xl mx-auto">
                <SpeakClient
                    userId={session.user.id}
                    sessionId={sessionId}
                />
            </div>
        </div>
    );
}

// Add this to override the default layout
SpeakPage.getLayout = function getLayout(page: React.ReactElement) {
    return <>{page}</>;
};