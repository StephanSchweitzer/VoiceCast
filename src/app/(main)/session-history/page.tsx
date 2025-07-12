import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import RecentSessionsClient from './RecentSessionsClient';

export default async function RecentSessionsPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/auth/login');
    }

    return (
        <div className="w-full h-full">
            <div className="mx-auto max-w-6xl sm:px-6 lg:px-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Recent Sessions
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Browse and search through your conversation history
                    </p>
                </div>

                <RecentSessionsClient userId={session.user.id} />
            </div>
        </div>
    );
}