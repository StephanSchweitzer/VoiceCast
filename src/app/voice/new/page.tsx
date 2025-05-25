import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import CreateVoiceForm from '@/components/voice/CreateVoiceForm';

export default async function CreateVoicePage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/auth/login');
    }

    // Fetch available genres
    const genresRaw = await prisma.genre.findMany({
        orderBy: { name: 'asc' }
    });

    // Simple serialization - converts all Date objects to strings
    const genres = JSON.parse(JSON.stringify(genresRaw));

    return (
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 md:px-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Voice</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Upload a short audio sample (we suggest a minimum of 3 seconds) of your voice or any voice you want to clone.
                For best results, use a clear recording with minimal background noise.
            </p>

            <CreateVoiceForm genres={genres} />
        </div>
    );
}