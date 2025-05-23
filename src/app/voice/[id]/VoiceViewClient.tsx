'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertCircle } from 'lucide-react';
import VoicePlayer from '@/components/voice/VoicePlayer';
import DeleteVoiceButton from '@/components/voice/DeleteVoiceButton';
import { VoiceWithUser } from '@/types/voice';

interface VoiceViewClientProps {
    voiceId: string;
    userId: string;
}

// Skeleton component for loading state
function VoiceViewSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
                <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="flex space-x-2">
                    <div className="h-9 w-16 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                    <div className="h-9 w-16 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                </div>
            </div>

            {/* Description skeleton */}
            <div className="space-y-2">
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>

            {/* Voice Sample section skeleton */}
            <div className="space-y-4">
                <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-16 w-full bg-gray-200 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600"></div>
            </div>

            {/* Text-to-Speech section skeleton */}
            <div className="space-y-4">
                <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="space-y-2">
                    <div className="h-24 w-full bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                    <div className="flex justify-end">
                        <div className="h-9 w-32 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                    </div>
                </div>
            </div>

            {/* Footer skeleton */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                <div className="flex items-center space-x-2">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-1 w-1 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        </div>
    );
}

// Error component
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Voice not found
                </h3>
                <p className="text-sm text-red-600 dark:text-red-400 mb-4 max-w-md">
                    {message}
                </p>
                <div className="space-x-2">
                    <Button onClick={onRetry} variant="outline">
                        Try Again
                    </Button>
                    <Button asChild variant="default">
                        <Link href="/voice">
                            Browse Voices
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function VoiceViewClient({ voiceId, userId }: VoiceViewClientProps) {
    const [voice, setVoice] = useState<VoiceWithUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [ttsText, setTtsText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const router = useRouter();

    const loadVoice = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/voices/${voiceId}`);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('This voice could not be found or may have been deleted.');
                } else if (response.status === 401 || response.status === 403) {
                    throw new Error('You don\'t have permission to view this voice.');
                } else {
                    throw new Error('Failed to load voice data. Please try again.');
                }
            }

            const voiceData: VoiceWithUser = await response.json();

            // Check permissions client-side as well
            const isOwner = voiceData.userId === userId;
            if (!voiceData.isPublic && !isOwner) {
                throw new Error('This voice is private and you don\'t have permission to view it.');
            }

            setVoice(voiceData);

        } catch (err) {
            console.error('Error loading voice:', err);
            const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
            setError(errorMessage);

            // Redirect after delay for permission errors
            if (errorMessage.includes('permission') || errorMessage.includes('private')) {
                setTimeout(() => {
                    router.push('/voice');
                }, 3000);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadVoice();
    }, [voiceId, userId]);

    const handleGenerateSpeech = async () => {
        if (!ttsText.trim() || !voice) return;

        setIsGenerating(true);
        try {
            // Add your TTS API call here
            console.log('Generating speech for:', ttsText);
            // Example: await generateSpeech(voice.id, ttsText);
        } catch (error) {
            console.error('Error generating speech:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRetry = () => {
        loadVoice();
    };

    const isOwner = voice ? voice.userId === userId : false;

    return (
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 md:px-8">
            {loading && (
                <div>
                    <div className="flex items-center justify-center mb-6">
                        <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                        <span className="text-sm text-muted-foreground">Loading voice...</span>
                    </div>
                    <VoiceViewSkeleton />
                </div>
            )}

            {error && (
                <ErrorState message={error} onRetry={handleRetry} />
            )}

            {voice && !loading && !error && (
                <div className="space-y-8">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {voice.name}
                        </h1>

                        {isOwner && (
                            <div className="flex space-x-2">
                                <Button variant="outline" asChild>
                                    <Link href={`/voice/${voiceId}/edit`}>
                                        Edit
                                    </Link>
                                </Button>
                                <DeleteVoiceButton voiceId={voiceId} />
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    {voice.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {voice.description}
                        </p>
                    )}

                    {/* Voice Sample */}
                    <div>
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                            Voice Sample
                        </h2>
                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                            <VoicePlayer audioUrl={voice.audioSample} />
                        </div>
                    </div>

                    {/* Text-to-Speech */}
                    <div>
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Text-to-Speech
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Type or paste text below to convert it to speech using this voice.
                        </p>
                        <div className="space-y-3">
                            <Textarea
                                rows={4}
                                placeholder="Enter text to convert to speech..."
                                className="resize-none"
                                value={ttsText}
                                onChange={(e) => setTtsText(e.target.value)}
                            />
                            <div className="flex justify-end">
                                <Button
                                    variant="outline"
                                    onClick={handleGenerateSpeech}
                                    disabled={!ttsText.trim() || isGenerating}
                                >
                                    {isGenerating ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Generating...
                                        </div>
                                    ) : (
                                        'Generate Speech'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                        <div className="flex items-center">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                Created by {voice.user.name || 'Anonymous'}
                            </span>
                            <span className="mx-2 text-gray-500 dark:text-gray-400">•</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {voice.isPublic ? 'Public' : 'Private'} voice
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}