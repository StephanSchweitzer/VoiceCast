import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Link from 'next/link';

export default async function Dashboard() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/auth/login');
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

    // Fetch user's speak sessions
    const speakSessions = await prisma.speakSession.findMany({
        where: {
            userId: session.user.id
        },
        include: {
            _count: {
                select: {
                    generatedAudios: true
                }
            }
        },
        orderBy: {
            updatedAt: 'desc'
        },
        take: 4 // Show only the 4 most recent sessions
    });

    return (
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                    Dashboard
                </h1>

                {/* Large Speak Button */}
                <div className="mb-8">
                    <Link
                        href="/speak"
                        className="group relative block w-full overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-center shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-blue-500/50"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-purple-600/90 transition-opacity group-hover:opacity-75"></div>
                        <div className="relative">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Start Speaking</h2>
                            <p className="text-lg text-white/90">
                                Generate expressive speech from your voice library instantly
                            </p>
                        </div>
                    </Link>
                </div>

                {/* Previous Sessions */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Sessions</h2>
                        {speakSessions.length > 4 && (
                            <Link
                                href="/sessions"
                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                            >
                                View all sessions →
                            </Link>
                        )}
                    </div>

                    {speakSessions.length > 0 ? (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {speakSessions.map((speakSession) => (
                                <Link
                                    key={speakSession.id}
                                    href={`/speak?session=${speakSession.id}`}
                                    className="group block rounded-xl bg-gray-100 dark:bg-gray-700 p-6 text-center transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105 hover:shadow-lg"
                                >
                                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-300 dark:bg-gray-600 mx-auto group-hover:bg-gray-400 dark:group-hover:bg-gray-500 transition-colors">
                                        <svg className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                    </div>
                                    <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-1 truncate">
                                        {speakSession.name}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                        {speakSession._count.generatedAudios} audio{speakSession._count.generatedAudios !== 1 ? 's' : ''}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                        {new Date(speakSession.updatedAt).toLocaleDateString()}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 rounded-xl bg-gray-50 dark:bg-gray-800">
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 mx-auto">
                                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                No previous sessions yet. Start speaking to create your first session!
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Existing Voices Section - moved lower in priority */}
            <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow">
                <div className="px-4 py-5 sm:p-6">
                    <div className="sm:flex sm:items-center sm:justify-between mb-4">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Your Voice Library</h2>
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

                    {voices.length > 0 ? (
                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                            {voices.map((voice) => (
                                <Link
                                    key={voice.id}
                                    href={`/voice/${voice.id}`}
                                    className="block rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
                        <div className="text-center py-8">
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