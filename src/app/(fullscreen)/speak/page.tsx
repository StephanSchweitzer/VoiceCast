import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import SpeakClient from './SpeakClient';

export default async function SpeakNewPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/auth/login');
    }

    return (
        <div className="w-full h-full">
            <div className="mx-auto max-w-6xl sm:px-6 lg:px-8">
                <SpeakClient
                    userId={session.user.id}
                    mode="new"
                />
            </div>
        </div>
    );
}