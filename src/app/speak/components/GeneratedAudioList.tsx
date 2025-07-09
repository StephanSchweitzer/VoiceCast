'use client';

import { useState, useRef, useEffect } from 'react';
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

// Emotion color mappings to match TextInput component
const EMOTION_COLORS = {
    neutral: 'bg-gray-500 dark:bg-gray-600',
    happy: 'bg-yellow-500 dark:bg-yellow-600',
    sad: 'bg-blue-500 dark:bg-blue-600',
    angry: 'bg-red-500 dark:bg-red-600',
    fearful: 'bg-purple-500 dark:bg-purple-600',
    surprised: 'bg-green-500 dark:bg-green-600'
};

// Lighter background colors for the card backgrounds
const EMOTION_BG_COLORS = {
    neutral: 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700',
    happy: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    sad: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    angry: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    fearful: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    surprised: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
};

export default function GeneratedAudioList({
                                               audios,
                                               hasMore,
                                               onLoadMore,
                                               onUpdateAudio,
                                               onDeleteAudio
                                           }: GeneratedAudioListProps) {
    const [loadingMore, setLoadingMore] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [audios.length]);

    const handleLoadMore = async () => {
        setLoadingMore(true);
        const scrollContainer = scrollContainerRef.current;
        const scrollHeightBefore = scrollContainer?.scrollHeight || 0;

        try {
            await onLoadMore();

            // Maintain scroll position after loading more
            setTimeout(() => {
                if (scrollContainer) {
                    const scrollHeightAfter = scrollContainer.scrollHeight;
                    const scrollDifference = scrollHeightAfter - scrollHeightBefore;
                    scrollContainer.scrollTop += scrollDifference;
                }
            }, 100);
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
            <div className="h-full flex flex-col items-center justify-center space-y-4 text-center p-8">
                <Volume2 className="h-12 w-12 text-gray-400" />
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Start Your Conversation
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Type a message below to generate your first speech.
                    </p>
                </div>
            </div>
        );
    }

    // Reverse the order to show newest at bottom (like messaging)
    const reversedAudios = [...audios].reverse();

    return (
        <div className="h-full flex flex-col">
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto space-y-3 p-4"
            >
                {/* Load More Button at top */}
                {hasMore && (
                    <div className="flex justify-center pb-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            className="text-xs"
                        >
                            {loadingMore ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Loading...
                                </div>
                            ) : (
                                'Load Earlier Messages'
                            )}
                        </Button>
                    </div>
                )}

                {/* Audio Cards */}
                {reversedAudios.map((audio, index) => {
                    const emotionColorClass = EMOTION_COLORS[audio.emotion as keyof typeof EMOTION_COLORS] || EMOTION_COLORS.neutral;
                    const emotionBgClass = EMOTION_BG_COLORS[audio.emotion as keyof typeof EMOTION_BG_COLORS] || EMOTION_BG_COLORS.neutral;

                    return (
                        <Card key={audio.id} className={`w-full border ${emotionBgClass} shadow-sm hover:shadow-md transition-shadow duration-200`}>
                            <CardContent className="p-4">
                                <div className="flex justify-between gap-4">
                                    {/* Left side - Content */}
                                    <div className="flex-1 min-w-0">
                                        {/* Emotion indicator bar and text */}
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={`w-1 h-6 ${emotionColorClass} rounded-full`}></div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1 line-clamp-2">
                                                    "{audio.text}"
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                                    <span className="font-medium">{audio.voice.name}</span>
                                                    <span>•</span>
                                                    <span className={`px-2 py-1 rounded text-white ${emotionColorClass} capitalize`}>
                                                        {audio.emotion}
                                                    </span>
                                                    <span>•</span>
                                                    <span>
                                                        {new Date(audio.createdAt).toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Audio Player */}
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                            <VoicePlayer audioUrl={audio.filePath} />
                                        </div>
                                    </div>

                                    {/* Right side - Actions (centered with audio player) */}
                                    <div className="flex flex-col gap-1 flex-shrink-0 justify-center self-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => updateLikeStatus(audio.id, audio.isLiked === true ? null : true)}
                                            className={`h-8 w-8 p-0 ${
                                                audio.isLiked === true
                                                    ? 'text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400'
                                                    : 'text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                                            }`}
                                        >
                                            <ThumbsUp className="h-4 w-4" />
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => updateLikeStatus(audio.id, audio.isLiked === false ? null : false)}
                                            className={`h-8 w-8 p-0 ${
                                                audio.isLiked === false
                                                    ? 'text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400'
                                                    : 'text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                                            }`}
                                        >
                                            <ThumbsDown className="h-4 w-4" />
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => deleteAudio(audio.id)}
                                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {/* Auto-scroll anchor */}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}