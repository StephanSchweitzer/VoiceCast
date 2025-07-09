'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Loader2,
    Volume2,
    ThumbsUp,
    ThumbsDown,
    Trash2
} from 'lucide-react';
import VoicePlayer from '@/components/voice/VoicePlayer';
import { GeneratedAudio } from '@/types/speak';

interface GeneratedAudioListProps {
    audios: GeneratedAudio[];
    hasMore: boolean;
    onLoadMore: () => Promise<void>;
    onUpdateAudio: (audioId: string, updates: Partial<GeneratedAudio>) => void;
    onDeleteAudio: (audioId: string) => void;
}

export default function GeneratedAudioList({
                                               audios,
                                               hasMore,
                                               onLoadMore,
                                               onUpdateAudio,
                                               onDeleteAudio
                                           }: GeneratedAudioListProps) {
    const [loadingMore, setLoadingMore] = useState(false);

    const handleLoadMore = async () => {
        setLoadingMore(true);
        try {
            await onLoadMore();
        } finally {
            setLoadingMore(false);
        }
    };

    const updateLikeStatus = async (audioId: string, isLiked: boolean | null) => {
        try {
            const response = await fetch(`/api/generated-audio/${audioId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isLiked }),
            });

            if (!response.ok) throw new Error('Failed to update rating');
            onUpdateAudio(audioId, { isLiked: isLiked ?? undefined });
        } catch (error) {
            console.error('Error updating like status:', error);
        }
    };

    const deleteAudio = async (audioId: string) => {
        try {
            const response = await fetch(`/api/generated-audio/${audioId}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete audio');
            onDeleteAudio(audioId);
        } catch (error) {
            console.error('Error deleting audio:', error);
        }
    };

    if (audios.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Volume2 className="h-12 w-12 text-gray-400" />
                    <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            No audio generated yet
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Generate your first speech to see it here.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Generated Audio ({audios.length})
            </h3>

            {audios.map((audio) => (
                <Card key={audio.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                        <div className="space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        "{audio.text}"
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {audio.voice.name}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                            {audio.emotion}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {new Date(audio.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => updateLikeStatus(audio.id, audio.isLiked === true ? null : true)}
                                        className={`h-8 w-8 p-0 ${audio.isLiked === true ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-gray-400 hover:text-green-600'}`}
                                    >
                                        <ThumbsUp className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => updateLikeStatus(audio.id, audio.isLiked === false ? null : false)}
                                        className={`h-8 w-8 p-0 ${audio.isLiked === false ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : 'text-gray-400 hover:text-red-600'}`}
                                    >
                                        <ThumbsDown className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteAudio(audio.id)}
                                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                                <VoicePlayer audioUrl={audio.filePath} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}

            {/* Load More Button */}
            {hasMore && (
                <div className="flex justify-center">
                    <Button
                        variant="outline"
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="min-w-[120px]"
                    >
                        {loadingMore ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading...
                            </div>
                        ) : (
                            'Load More'
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}