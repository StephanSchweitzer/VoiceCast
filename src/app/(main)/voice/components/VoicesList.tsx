'use client';

import { Mic, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import VoiceCard from '@/components/voice/VoiceCard'; // Adjust path as needed
import VoiceSkeleton from './VoiceSkeleton';

// Type based on your API response
interface VoiceLibraryItem {
    id: string;
    name: string;
    description: string | null;
    audioSample: string;
    duration: number | null;
    isPublic: boolean;
    gender: string | null;
    createdAt: string;
    updatedAt: string;
    userId: string;
    genre?: {
        id: string;
        name: string;
    } | null;
    user?: {
        name: string | null;
        image: string | null;
    } | null;
    isSaved: boolean;
}

interface VoicesListProps {
    voices: VoiceLibraryItem[];
    loading: boolean;
    error: string | null;
    onRetry: () => void;
    searchQuery: string;
    currentUserId: string;
}

export default function VoicesList({
                                       voices,
                                       loading,
                                       error,
                                       onRetry,
                                       searchQuery,
                                       currentUserId
                                   }: VoicesListProps) {
    // Loading state
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(12)].map((_, i) => (
                    <VoiceSkeleton key={i} />
                ))}
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <Card className="bg-gray-100 dark:bg-gray-800 border-red-200 dark:border-red-800">
                <CardContent className="p-6">
                    <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {error}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onRetry}
                                className="ml-4"
                            >
                                Try again
                            </Button>
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    // Empty state
    if (voices.length === 0) {
        return (
            <Card className="bg-gray-100 dark:bg-gray-800">
                <CardContent className="text-center py-12">
                    <Mic className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        {searchQuery ? 'No voices found' : 'No voices in your library yet'}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        {searchQuery
                            ? `No voices match "${searchQuery}". Try a different search term.`
                            : 'Start creating or saving voices to build your library.'
                        }
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {voices.map((voice) => (
                <VoiceCard
                    key={voice.id}
                    voice={{
                        ...voice,
                        // Convert string dates back to Date objects for VoiceCard
                        createdAt: new Date(voice.createdAt),
                        updatedAt: new Date(voice.updatedAt)
                    }}
                    isOwner={voice.userId === currentUserId}
                    user={voice.user}
                    variant="grid"
                    isSaved={voice.isSaved}
                    // No onToggleSave since this is just a library view
                />
            ))}
        </div>
    );
}