import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import VoicesClient from './VoicesClient';

export default async function VoicesPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/auth/login');
    }

    return (
        <div className="w-full h-full">
            <div className="mx-auto max-w-6xl sm:px-6 lg:px-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Your Voice Library
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Browse through your uploaded and saved voices
                    </p>
                </div>

                <VoicesClient userId={session.user.id} />
            </div>
        </div>
    );
}