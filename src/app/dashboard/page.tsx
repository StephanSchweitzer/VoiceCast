import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Link from 'next/link';

export default async function Dashboard() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    // Fetch user's voices
    const voices = await prisma.voice.findMany({
        where: {
            userId: session.user.id
        },
        orderBy: {
            updatedAt: 'desc'
        }
    });

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-8 sm:flex sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Dashboard
                </h1>
                <Link
                    href="/voice/new"
                    className="mt-3 inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 sm:mt-0"
                >
                    <svg className="-ml-0.5 mr-1.5 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    New Voice
                </Link>
            </div>

            <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow">
                <div className="px-4 py-5 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">Your Voices</h2>

                    {voices.length > 0 ? (
                        <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                            {voices.map((voice) => (
                                <Link
                                    key={voice.id}
                                    href={`/voice/${voice.id}`}
                                    className="block rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    <h3 className="text-md font-medium text-gray-900 dark:text-white">{voice.name}</h3>
                                    {voice.description && (
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                            {voice.description}
                                        </p>
                                    )}
                                    <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <span className={`mr-2 rounded-full px-2 py-0.5 ${voice.isPublic ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'}`}>
                      {voice.isPublic ? 'Public' : 'Private'}
                    </span>
                                        <span>
                      Created: {new Date(voice.createdAt).toLocaleDateString()}
                    </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-4 text-center py-8">
                            <p className="text-gray-500 dark:text-gray-400">
                                You haven't created any voices yet.
                            </p>
                            <Link
                                href="/voice/new"
                                className="mt-3 inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                            >
                                Create Your First Voice
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow">
                <div className="px-4 py-5 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">Activity</h2>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">
                        Recent activity will be shown here.
                    </p>
                </div>
            </div>
        </div>
    );
}