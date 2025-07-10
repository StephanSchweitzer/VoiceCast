'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Play, Pause, AlertCircle } from "lucide-react";

interface VoicePlayerProps {
    audioUrl: string;
    recordedDuration?: number; // Duration in seconds - NEW PROP
}

export default function VoicePlayer({ audioUrl, recordedDuration }: VoicePlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(recordedDuration || 0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    // Reset state when audioUrl changes
    useEffect(() => {
        setIsPlaying(false);
        setDuration(recordedDuration || 0);
        setCurrentTime(0);
        setIsLoaded(false);
        setError(null); // Reset error state
    }, [audioUrl, recordedDuration]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const setAudioData = () => {
            // Prefer recordedDuration if available, otherwise use audio duration
            if (recordedDuration) {
                setDuration(recordedDuration);
                setIsLoaded(true);
            } else if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
                setDuration(audio.duration);
                setIsLoaded(true);
            }
            setError(null); // Clear error if audio loads successfully
        };

        const setAudioTime = () => {
            if (!isNaN(audio.currentTime)) {
                setCurrentTime(audio.currentTime);

                // If we didn't have duration before, try to get it during playback
                if (duration === 0 && audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
                    setDuration(audio.duration);
                }
            }
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        const handleLoadStart = () => {
            if (!recordedDuration) {
                setIsLoaded(false);
            }
            setError(null); // Clear error when starting to load
        };

        const handleCanPlay = () => {
            setIsLoaded(true);
            if (!recordedDuration) {
                setAudioData();
            }
            setError(null); // Clear error if audio can play
        };

        const handleDurationChange = () => {
            // This fires when duration becomes available
            if (!recordedDuration && audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
                setDuration(audio.duration);
            }
        };

        const handleError = (e: Event) => {
            console.error('Audio loading error:', e);
            setIsLoaded(false);
            setIsPlaying(false);
            setError("The audio file associated with this voice was not found. Please try again or upload a new one.");
            if (!recordedDuration) {
                setDuration(0);
            }
            setCurrentTime(0);
        };

        // Event listeners - use loadeddata for recorded audio compatibility
        audio.addEventListener('loadstart', handleLoadStart);
        audio.addEventListener('loadeddata', setAudioData);
        audio.addEventListener('loadedmetadata', setAudioData);
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('durationchange', handleDurationChange);
        audio.addEventListener('timeupdate', setAudioTime);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);

        // If we have recordedDuration, we can consider it loaded
        if (recordedDuration) {
            setIsLoaded(true);
        }

        return () => {
            audio.removeEventListener('loadstart', handleLoadStart);
            audio.removeEventListener('loadeddata', setAudioData);
            audio.removeEventListener('loadedmetadata', setAudioData);
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('durationchange', handleDurationChange);
            audio.removeEventListener('timeupdate', setAudioTime);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
        };
    }, [recordedDuration, duration]);

    const handlePlayPause = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const audio = audioRef.current;
        if (!audio || error) return;

        try {
            if (isPlaying) {
                audio.pause();
                setIsPlaying(false);
            } else {
                // Allow playing if we have recordedDuration or if audio is ready
                if (recordedDuration || isLoaded || audio.readyState >= 2) {
                    await audio.play();
                    setIsPlaying(true);

                    // Try to get duration on first play if we don't have it
                    if (duration === 0 && audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
                        setDuration(audio.duration);
                    }
                }
            }
        } catch (playError) {
            console.error('Audio play error:', playError);
            setIsPlaying(false);
            setError("Unable to play this audio file. Please try again or upload a new one.");
        }
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();

        const audio = audioRef.current;
        if (!audio || error) return;

        const newTime = parseFloat(e.target.value);
        if (!isNaN(newTime) && newTime >= 0) {
            // Be more permissive with seeking when we have recordedDuration
            if (duration > 0 && newTime <= duration) {
                audio.currentTime = newTime;
                setCurrentTime(newTime);
            } else if (recordedDuration && newTime <= recordedDuration) {
                try {
                    audio.currentTime = newTime;
                    setCurrentTime(newTime);
                } catch (seekError) {
                    console.warn('Seeking failed:', seekError);
                }
            }
        }
    };

    const formatTime = (time: number): string => {
        if (isNaN(time) || !isFinite(time) || time < 0) {
            return '0:00';
        }

        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);

        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Determine if the player should be considered ready
    const isReady = recordedDuration ? true : isLoaded;

    return (
        <div className="rounded-md bg-white dark:bg-gray-700 p-4 border border-gray-200 dark:border-gray-600">
            <audio ref={audioRef} src={audioUrl} preload="metadata" />

            {error ? (
                // Error state - show user-friendly message
                <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                </div>
            ) : (
                // Normal player UI
                <div className="flex items-center gap-4">
                    <Button
                        type="button"
                        size="icon"
                        onClick={handlePlayPause}
                        className="h-10 w-10 rounded-full flex-shrink-0"
                        variant="default"
                        disabled={!isReady}
                    >
                        {isPlaying ? (
                            <Pause className="h-5 w-5" />
                        ) : (
                            <Play className="h-5 w-5 ml-0.5" />
                        )}
                    </Button>
                    <div className="flex-1 space-y-1">
                        <input
                            type="range"
                            min="0"
                            max={duration || 0}
                            value={currentTime}
                            onChange={handleTimeChange}
                            disabled={!isReady}
                            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-600 accent-blue-600 dark:accent-blue-500 disabled:opacity-50"
                        />
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}