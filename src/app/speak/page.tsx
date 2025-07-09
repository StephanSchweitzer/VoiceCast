import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import SpeakClient from './SpeakClient';

export default async function SpeakPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/auth/login');
    }

    return (
        <div className="flex flex-1 flex-col">
            <div className="w-full max-w-4xl mx-auto">
                <SpeakClient userId={session.user.id} />
            </div>
        </div>
    );
}