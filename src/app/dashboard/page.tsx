import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import VoiceCard from '@/components/voice/VoiceCard';

export default async function Dashboard() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/auth/login');
    }

    // Fetch user's own voices
    const ownVoices = await prisma.voice.findMany({
        where: {
            userId: session.user.id
        },
        include: {
            genre: true
        },
        orderBy: {
            updatedAt: 'desc'
        }
    });

    // Fetch user's saved voices
    const savedVoices = await prisma.savedVoice.findMany({
        where: {
            userId: session.user.id
        },
        include: {
            voice: {
                include: {
                    genre: true,
                    user: {
                        select: {
                            name: true,
                            id: true
                        }
                    }
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
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

                {/* Start Speaking Card */}
                <div className="mb-8">
                    <Link
                        href="/speak"
                        className="group relative block w-full rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-center shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-blue-500/50"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-purple-600/90 transition-opacity group-hover:opacity-75 rounded-2xl"></div>
                        <div className="relative">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Start Speaking</h2>
                            <p className="text-lg text-white/90">
                                Choose from your voices or community voices and generate speech with any emotion instantly.
                            </p>
                        </div>
                    </Link>
                </div>

                {/* Recent Sessions */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Sessions</h2>
                        {speakSessions.length > 3 && (
                            <Link
                                href="/speak/recent-sessions"
                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                            >
                                All sessions →
                            </Link>
                        )}
                    </div>

                    {speakSessions.length > 0 ? (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {speakSessions.map((speakSession) => (
                                <Link
                                    key={speakSession.id}
                                    href={`/speak/session/${speakSession.id}`}
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

            {/* Voice Library Card */}
            <div className="mb-6 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 shadow">
                <div className="px-4 py-5 sm:p-6">
                    <div className="sm:flex sm:items-center sm:justify-between mb-4">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Your Voice Library</h2>
                        <div className="mt-3 sm:mt-0 flex gap-2">
                            <Link
                                href="/voice/community"
                                className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
                            >
                                <svg className="-ml-0.5 mr-1.5 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                Browse Community
                            </Link>
                            <Link
                                href="/voice/new"
                                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                            >
                                <svg className="-ml-0.5 mr-1.5 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                New Voice
                            </Link>
                        </div>
                    </div>

                    {(ownVoices.length > 0 || savedVoices.length > 0) ? (
                        <>
                            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                {/* Own voices first */}
                                {ownVoices.slice(0, 8).map((voice) => (
                                    <VoiceCard
                                        key={`own-${voice.id}`}
                                        voice={voice}
                                        isOwner={true}
                                    />
                                ))}
                                {/* Then saved voices, up to remaining slots */}
                                {savedVoices.slice(0, Math.max(0, 8 - ownVoices.length)).map((savedVoice) => (
                                    <div key={`saved-${savedVoice.id}`} className="relative">
                                        <VoiceCard
                                            voice={savedVoice.voice}
                                            isOwner={false}
                                        />
                                        {/* Small indicator showing it's saved */}
                                        <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                                            <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        {/* Show creator name */}
                                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                                            by {savedVoice.voice.user.name || 'Anonymous'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* See all voices link */}
                            <div className="mt-4 text-right">
                                <Link
                                    href="/voice"
                                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                                >
                                    See all voices →
                                </Link>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500 dark:text-gray-400">
                                You haven't created or saved any voices yet.
                            </p>
                            <div className="mt-3 flex justify-center gap-2">
                                <Link
                                    href="/voice/new"
                                    className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                                >
                                    Create Your First Voice
                                </Link>
                                <Link
                                    href="/voice/community"
                                    className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
                                >
                                    Browse Community
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Activity Card */}
            <div className="overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 shadow">
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