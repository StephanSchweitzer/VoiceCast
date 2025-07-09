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
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                        Speak
                    </h1>
                    <p className="mt-3 text-lg text-gray-600 dark:text-gray-300">
                        Generate speech with your voices and have natural conversations.
                    </p>
                </div>
                <SpeakClient userId={session.user.id} />
            </div>
        </div>
    );
}