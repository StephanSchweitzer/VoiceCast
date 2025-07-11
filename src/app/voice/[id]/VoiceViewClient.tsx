'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Loader2,
    AlertCircle,
    Clock,
    User,
    Tag,
    Calendar,
    Volume2,
    Globe,
    Lock,
    Edit,
    Settings,
    Heart,
    BookmarkPlus,
    BookmarkCheck,
    MessageSquare,
    ArrowRight
} from 'lucide-react';
import VoicePlayer from '@/components/voice/VoicePlayer';
import DeleteVoiceButton from '@/components/voice/DeleteVoiceButton';
import { VoiceWithUser } from '@/types/voice';

interface VoiceViewClientProps {
    voiceId: string;
    userId: string;
}

function VoiceViewSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header Card Skeleton */}
            <Card className="bg-gray-100 dark:bg-gray-800">
                <CardHeader className="pb-4">
                    <div className="space-y-3">
                        {/* Responsive width instead of fixed w-64 */}
                        <div className="h-8 w-full max-w-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        {/* Responsive width instead of fixed w-48 */}
                        <div className="h-4 w-full max-w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        <div className="h-6 w-14 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    </div>
                    {/* Made grid more responsive for mobile */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="space-y-2">
                                <div className="h-4 w-full max-w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                <div className="h-5 w-full max-w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Voice Sample Card Skeleton */}
            <Card className="bg-gray-100 dark:bg-gray-800">
                <CardHeader>
                    <div className="h-6 w-full max-w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </CardHeader>
                <CardContent>
                    <div className="h-16 w-full bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                </CardContent>
            </Card>

            {/* CTA Card Skeleton */}
            <Card className="bg-gray-100 dark:bg-gray-800">
                <CardHeader>
                    <div className="h-6 w-full max-w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="h-12 w-full bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                </CardContent>
            </Card>
        </div>
    );
}

// Error component
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <Card className="bg-gray-100 dark:bg-gray-800 border-red-200 dark:border-red-800">
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
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
            </CardContent>
        </Card>
    );
}

// Utility function to format duration
function formatDuration(seconds: number | null | undefined): string {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Utility function to format date
function formatDate(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}


export default function VoiceViewClient({ voiceId, userId }: VoiceViewClientProps) {
    const [voice, setVoice] = useState<VoiceWithUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // New state for saved voice functionality
    const [isSaved, setIsSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const router = useRouter();

    const loadVoice = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch voice data and saved status simultaneously
            const [voiceResponse, savedResponse] = await Promise.all([
                fetch(`/api/voices/${voiceId}`),
                fetch(`/api/voices/${voiceId}/saved`)
            ]);

            // Handle voice data response
            if (!voiceResponse.ok) {
                if (voiceResponse.status === 404) {
                    throw new Error('This voice could not be found or may have been deleted.');
                } else if (voiceResponse.status === 401 || voiceResponse.status === 403) {
                    throw new Error('You don\'t have permission to view this voice.');
                } else {
                    throw new Error('Failed to load voice data. Please try again.');
                }
            }

            const voiceData: VoiceWithUser = await voiceResponse.json();

            // Check permissions client-side as well
            const isOwner = voiceData.userId === userId;
            if (!voiceData.isPublic && !isOwner) {
                throw new Error('This voice is private and you don\'t have permission to view it.');
            }

            // Handle saved status for non-owners
            let savedStatus = false;
            if (!isOwner && savedResponse.ok) {
                const savedData = await savedResponse.json();
                savedStatus = savedData.isSaved;
            }

            // Update all state at once to prevent flicker
            setVoice(voiceData);
            setIsSaved(savedStatus);

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

    const handleSaveToggle = async () => {
        if (!voice) return;

        setIsSaving(true);
        setSaveError(null);

        try {
            const method = isSaved ? 'DELETE' : 'POST';
            const response = await fetch(`/api/voices/${voiceId}/saved`, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update saved status');
            }

            setIsSaved(!isSaved);
        } catch (err) {
            console.error('Error toggling saved status:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to update saved status';
            setSaveError(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    const handleStartSpeaking = async () => {
        if (!voice) return;

        // If user doesn't own the voice and hasn't saved it, auto-save it first
        if (!isOwner && !isSaved) {
            try {
                setIsSaving(true);
                const response = await fetch(`/api/voices/${voiceId}/saved`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    setIsSaved(true);
                }
                // Continue to speak page even if save fails - don't block the user
            } catch (err) {
                console.error('Error auto-saving voice:', err);
                // Continue to speak page even if save fails
            } finally {
                setIsSaving(false);
            }
        }

        // Navigate to speak page with voice parameter
        router.push(`/speak?voice=${voiceId}`);
    };

    useEffect(() => {
        loadVoice();
    }, [voiceId, userId]);

    const handleRetry = () => {
        loadVoice();
    };

    const isOwner = voice ? voice.userId === userId : false;

    return (
        <div className="mx-auto max-w-4xl">
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
                <div className="space-y-6">
                    {/* Manage Section - Only visible to owner */}
                    {isOwner && (
                        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-lg text-blue-900 dark:text-blue-100">
                                    <Settings className="h-5 w-5" />
                                    Manage Voice
                                </CardTitle>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    Edit your voice settings or remove it from your library.
                                </p>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-3">
                                    <Button variant="outline" size="sm" asChild className="bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                        <Link href={`/voice/${voiceId}/edit`}>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit Voice
                                        </Link>
                                    </Button>
                                    <DeleteVoiceButton voiceId={voiceId} />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Save to Library Section - Only visible to non-owners */}
                    {!isOwner && (
                        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-lg text-green-900 dark:text-green-100">
                                    <Heart className="h-5 w-5" />
                                    Voice Library
                                </CardTitle>
                                <p className="text-sm text-green-700 dark:text-green-300">
                                    {isSaved
                                        ? 'This voice is saved to your library. You can access it anytime from your voice collection.'
                                        : 'Save this voice to your library for quick access and easy text-to-speech generation.'
                                    }
                                </p>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-3">
                                    <Button
                                        onClick={handleSaveToggle}
                                        disabled={isSaving}
                                        className={`${isSaved
                                            ? 'bg-green-600 hover:bg-green-700 text-white'
                                            : 'bg-green-600 hover:bg-green-700 text-white'
                                        }`}
                                        size="sm"
                                    >
                                        {isSaving ? (
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                {isSaved ? 'Removing...' : 'Saving...'}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                {isSaved ? (
                                                    <>
                                                        <BookmarkCheck className="h-4 w-4" />
                                                        Saved to Library
                                                    </>
                                                ) : (
                                                    <>
                                                        <BookmarkPlus className="h-4 w-4" />
                                                        Save to Library
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </Button>
                                    {isSaved && (
                                        <Button variant="outline" size="sm" asChild className="bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                            <Link href="/voice">
                                                View My Library
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                                {saveError && (
                                    <div className="mt-3 p-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 text-red-500" />
                                            <span className="text-sm text-red-700 dark:text-red-300">{saveError}</span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Header Card with Voice Information */}
                    <Card className="bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <CardHeader className="pb-4">
                            <div className="space-y-2">
                                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {voice.name}
                                </CardTitle>
                                {voice.description && (
                                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
                                        {voice.description}
                                    </p>
                                )}
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            {/* Status Badges */}
                            <div className="flex flex-wrap gap-2">
                                <Badge variant={voice.isPublic ? "default" : "secondary"} className="flex items-center gap-1">
                                    {voice.isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                                    {voice.isPublic ? 'Public' : 'Private'}
                                </Badge>

                                {voice.gender && (
                                    <Badge variant="outline" className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {voice.gender}
                                    </Badge>
                                )}

                                {voice.genre && (
                                    <Badge variant="outline" className="flex items-center gap-1">
                                        <Tag className="h-3 w-3" />
                                        {voice.genre.name}
                                    </Badge>
                                )}
                            </div>

                            {/* Voice Metadata Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                        <Clock className="h-3 w-3" />
                                        Duration
                                    </div>
                                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {formatDuration(voice.duration)}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                        <User className="h-3 w-3" />
                                        Creator
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-5 w-5">
                                            <AvatarImage src={voice.user.image || ''} alt={voice.user.name || 'User'} />
                                            <AvatarFallback className="text-xs">
                                                {(voice.user.name || 'A').charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {voice.user.name || 'Anonymous'}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                        <Calendar className="h-3 w-3" />
                                        Created
                                    </div>
                                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {formatDate(voice.createdAt)}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                        <Calendar className="h-3 w-3" />
                                        Updated
                                    </div>
                                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {formatDate(voice.updatedAt)}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Voice Sample Card */}
                    <Card className="bg-gray-100 dark:bg-gray-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Volume2 className="h-5 w-5" />
                                Voice Sample
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="p-6 rounded-lg bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600">
                                <VoicePlayer audioUrl={voice.audioSample} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Call-to-Action Card - Start Speaking */}
                    <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-purple-200 dark:border-purple-800">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-xl text-purple-900 dark:text-purple-100">
                                <MessageSquare className="h-6 w-6" />
                                Ready to use this voice?
                            </CardTitle>
                            <p className="text-purple-700 dark:text-purple-300">
                                Start generating speech with {voice.name}. Choose from different emotions and create personalized audio messages.
                                {!isOwner && !isSaved && (
                                    <span className="block mt-1 text-sm font-medium">
                                        This voice will be saved to your library automatically.
                                    </span>
                                )}
                            </p>
                        </CardHeader>
                        <CardContent>
                            <Button
                                onClick={handleStartSpeaking}
                                disabled={isSaving}
                                size="lg"
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
                            >
                                {isSaving ? (
                                    <div className="flex items-center justify-center gap-3">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span className="font-semibold">Saving & Starting...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-3">
                                        <MessageSquare className="h-5 w-5" />
                                        <span className="font-semibold">Start Speaking with {voice.name}</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </div>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}