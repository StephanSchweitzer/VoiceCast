import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import VoiceCard from '@/components/voice/VoiceCard';

export default async function VoiceListPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/auth/login');
    }

    // Fetch user's voices
    const userVoices = await prisma.voice.findMany({
        where: {
            userId: session.user.id
        },
        orderBy: {
            updatedAt: 'desc'
        }
    });

    // Fetch public voices (excluding user's own voices)
    const publicVoices = await prisma.voice.findMany({
        where: {
            isPublic: true,
            NOT: {
                userId: session.user.id
            }
        },
        include: {
            user: {
                select: {
                    name: true
                }
            }
        },
        orderBy: {
            updatedAt: 'desc'
        },
        take: 6 // Limit to 6 public voices
    });

    // Check if user has any voices
    const hasVoices = userVoices.length > 0;

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-8 sm:flex sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Your Voices
                </h1>
                <Link
                    href="/voice/new"
                    className="mt-3 inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 sm:mt-0"
                >
                    <svg className="-ml-0.5 mr-1.5 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Create New Voice
                </Link>
            </div>

            {/* User's Voices Section */}
            <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow mb-8">
                <div className="px-4 py-5 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recent Voices</h2>

                    {hasVoices ? (
                        <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                            {userVoices.slice(0, 6).map((voice) => (
                                <VoiceCard key={voice.id} voice={voice} isOwner={true} />
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

                    {hasVoices && userVoices.length > 6 && (
                        <div className="mt-4 text-center">
                            <Link
                                href="/dashboard"
                                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                            >
                                View all your voices →
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Community Voices Section */}
            <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow">
                <div className="px-4 py-5 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">Community Voices</h2>

                    {publicVoices.length > 0 ? (
                        <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                            {publicVoices.map((voice) => (
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
                                        <span className="mr-2 rounded-full px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300">
                                            Public
                                        </span>
                                        <span>
                                            By: {voice.user?.name || 'Anonymous'}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-4 text-center py-8">
                            <p className="text-gray-500 dark:text-gray-400">
                                No community voices available yet.
                            </p>
                        </div>
                    )}

                    <div className="mt-4 text-center">
                        <Link
                            href="/voice/community"
                            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        >
                            Browse all community voices →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}