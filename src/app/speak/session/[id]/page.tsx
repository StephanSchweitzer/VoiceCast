import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import SpeakClient from '../../SpeakClient';

interface SpeakSessionPageProps {
    params: Promise<{ id: string }>
}

export default async function SpeakSessionPage({ params }: SpeakSessionPageProps) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/auth/login');
    }

    return (
        <div className="w-full h-full">
            <div className="w-full max-w-4xl mx-auto">
                <SpeakClient
                    userId={session.user.id}
                    mode="session"
                    sessionId={(await params).id}
                />
            </div>
        </div>
    );
}