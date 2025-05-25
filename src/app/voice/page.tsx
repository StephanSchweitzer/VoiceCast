import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import VoiceCard from '@/components/voice/VoiceCard';
import CommunityVoicesSection from '@/components/voice/CommunityVoicesSection';

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

    // Check if user has any voices
    const hasVoices = userVoices.length > 0;

    return (
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
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

            {/* Community Voices Section - Now using client component */}
            <CommunityVoicesSection />
        </div>
    );
}