'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import VoiceEditForm from '@/components/voice/VoiceEditForm';
import { VoiceWithUserAndGenre, Genre } from '@/types/voice';

interface VoiceEditClientProps {
    voiceId: string;
}

// Refined skeleton component
function VoiceEditSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="space-y-2">
                <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-md"></div>
            </div>

            <div className="space-y-2">
                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-24 w-full bg-gray-200 dark:bg-gray-700 rounded-md"></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                </div>
                <div className="space-y-2">
                    <div className="h-4 w-14 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>

            <div className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-32 w-full bg-gray-200 dark:bg-gray-700 rounded-md border-2 border-dashed border-gray-300 dark:border-gray-600"></div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                <div className="h-10 w-24 bg-primary/20 rounded-md"></div>
            </div>
        </div>
    );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Unable to load voice
                </h3>
                <p className="text-sm text-red-600 dark:text-red-400 mb-4 max-w-md">
                    {message}
                </p>
                <Button onClick={onRetry} variant="outline">
                    Try Again
                </Button>
            </div>
        </div>
    );
}

export default function VoiceEditClient({ voiceId }: VoiceEditClientProps) {
    const [voice, setVoice] = useState<VoiceWithUserAndGenre | null>(null);
    const [genres, setGenres] = useState<Genre[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const [voiceResponse, genresResponse] = await Promise.all([
                fetch(`/api/voices/${voiceId}`),
                fetch('/api/genres')
            ]);

            if (!voiceResponse.ok) {
                if (voiceResponse.status === 404) {
                    throw new Error('Voice not found');
                } else if (voiceResponse.status === 401 || voiceResponse.status === 403) {
                    throw new Error('You don\'t have permission to edit this voice');
                } else {
                    throw new Error('Failed to load voice data');
                }
            }

            const voiceData: VoiceWithUserAndGenre = await voiceResponse.json();

            let genresData: Genre[] = [];
            if (genresResponse.ok) {
                genresData = await genresResponse.json();
            }

            setVoice(voiceData);
            setGenres(genresData);

        } catch (err) {
            console.error('Error loading edit data:', err);
            const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
            setError(errorMessage);

            if (errorMessage.includes('permission')) {
                setTimeout(() => router.push('/voice'), 2000);
            }
        } finally {
            setLoading(false);
        }
    }, [voiceId, router]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSuccess = () => {
        router.push(`/voice/${voiceId}`);
    };

    // VERY simple callback - just refresh the page
    const handleVoiceUpdated = useCallback(() => {
        console.log('Voice updated, refreshing page...');
        window.location.reload();
    }, []);

    return (
        <div className="mx-auto max-w-3xl px-4">
            <div className="mb-6">
                <Button variant="ghost" asChild className="mb-4">
                    <Link href={`/voice/${voiceId}`} className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Voice
                    </Link>
                </Button>

                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {voice ? `Edit ${voice.name}` : 'Edit Voice'}
                </h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Modify your voice settings and audio sample. Changes will affect all future generations.
                </p>
            </div>

            <div className="min-h-[400px]">
                {loading && <VoiceEditSkeleton />}

                {error && <ErrorState message={error} onRetry={loadData} />}

                {voice && !loading && !error && (
                    <VoiceEditForm
                        voice={voice}
                        genres={genres}
                        onSuccess={handleSuccess}
                        onVoiceUpdated={handleVoiceUpdated}
                    />
                )}
            </div>
        </div>
    );
}