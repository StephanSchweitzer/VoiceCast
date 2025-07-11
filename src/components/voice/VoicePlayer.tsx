'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Play, Pause, AlertCircle } from "lucide-react";

interface VoicePlayerProps {
    audioUrl: string;
    recordedDuration?: number; // Duration in seconds
}

export default function VoicePlayer({ audioUrl, recordedDuration }: VoicePlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(recordedDuration || 0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const audioRef = useRef<HTMLAudioElement>(null);
    const animationFrameRef = useRef<number>();
    const lastUpdateTimeRef = useRef<number>(0);

    // Reset state when audioUrl changes
    useEffect(() => {
        setIsPlaying(false);
        setDuration(recordedDuration || 0);
        setCurrentTime(0);
        setIsLoaded(false);
        setError(null);
        setIsDragging(false);
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
    }, [audioUrl, recordedDuration]);

    // Smooth animation update function using requestAnimationFrame
    const updateProgress = useCallback(() => {
        const audio = audioRef.current;
        if (!audio || !isPlaying || isDragging) return;

        const now = performance.now();
        // Throttle updates to ~30fps to reduce excessive re-renders
        if (now - lastUpdateTimeRef.current > 33) {
            if (!isNaN(audio.currentTime)) {
                setCurrentTime(audio.currentTime);

                // Try to get duration during playback if we don't have it
                if (duration === 0 && audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
                    setDuration(audio.duration);
                }
            }
            lastUpdateTimeRef.current = now;
        }

        // Continue the animation loop
        animationFrameRef.current = requestAnimationFrame(updateProgress);
    }, [isPlaying, isDragging, duration]);

    // Start/stop the animation loop based on playing state
    useEffect(() => {
        if (isPlaying && !isDragging) {
            animationFrameRef.current = requestAnimationFrame(updateProgress);
        } else if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isPlaying, isDragging, updateProgress]);

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
            setError(null);
        };

        // Only update currentTime from timeupdate when not using requestAnimationFrame
        const setAudioTime = () => {
            if (!isPlaying && !isNaN(audio.currentTime)) {
                setCurrentTime(audio.currentTime);
            }
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };

        const handleLoadStart = () => {
            if (!recordedDuration) {
                setIsLoaded(false);
            }
            setError(null);
        };

        const handleCanPlay = () => {
            setIsLoaded(true);
            if (!recordedDuration) {
                setAudioData();
            }
            setError(null);
        };

        const handleDurationChange = () => {
            if (!recordedDuration && audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
                setDuration(audio.duration);
            }
        };

        const handleError = (e: Event) => {
            console.error('Audio loading error:', e);
            setIsLoaded(false);
            setIsPlaying(false);
            setError("Unable to load audio file. Please try again, and if the issue persists, contact support.");
            if (!recordedDuration) {
                setDuration(0);
            }
            setCurrentTime(0);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };

        // Event listeners
        audio.addEventListener('loadstart', handleLoadStart);
        audio.addEventListener('loadeddata', setAudioData);
        audio.addEventListener('loadedmetadata', setAudioData);
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('durationchange', handleDurationChange);
        audio.addEventListener('timeupdate', setAudioTime); // Only for when paused
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
    }, [recordedDuration, isPlaying]);

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
            setError("Unable to play this audio. Please try again, and if the issue persists, contact support.");
        }
    };

    // Handle drag start
    const handlePointerDown = (e: React.PointerEvent<HTMLInputElement>) => {
        setIsDragging(true);
        // Capture pointer to ensure we get pointerup even if cursor leaves element
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    // Handle drag end
    const handlePointerUp = (e: React.PointerEvent<HTMLInputElement>) => {
        setIsDragging(false);
        // Release pointer capture
        e.currentTarget.releasePointerCapture(e.pointerId);

        // Perform the actual seek on release
        const audio = audioRef.current;
        if (!audio || error) return;

        const newTime = parseFloat((e.target as HTMLInputElement).value);
        if (!isNaN(newTime) && newTime >= 0) {
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

    // Handle visual updates during dragging (immediate seeking for better UX)
    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();

        const newTime = parseFloat(e.target.value);
        if (!isNaN(newTime) && newTime >= 0) {
            setCurrentTime(newTime);

            // For better UX, seek immediately on change rather than waiting for drag end
            if (!isDragging) {
                const audio = audioRef.current;
                if (audio && duration > 0 && newTime <= duration) {
                    try {
                        audio.currentTime = newTime;
                    } catch (seekError) {
                        console.warn('Seeking failed:', seekError);
                    }
                } else if (audio && recordedDuration && newTime <= recordedDuration) {
                    try {
                        audio.currentTime = newTime;
                    } catch (seekError) {
                        console.warn('Seeking failed:', seekError);
                    }
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
        <div className="voice-player rounded-md bg-white dark:bg-gray-700 p-4 border border-gray-200 dark:border-gray-600">
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
                            step="0.01"
                            value={currentTime}
                            onChange={handleTimeChange}
                            onPointerDown={handlePointerDown}
                            onPointerUp={handlePointerUp}
                            disabled={!isReady}
                            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-600 disabled:opacity-50 transition-all duration-75"
                            style={{
                                background: `linear-gradient(to right, 
                                    rgb(37 99 235) 0%, 
                                    rgb(37 99 235) ${duration > 0 ? (currentTime / duration) * 100 : 0}%, 
                                    rgb(229 231 235) ${duration > 0 ? (currentTime / duration) * 100 : 0}%, 
                                    rgb(229 231 235) 100%)`
                            }}
                        />
                        {/* Hide the range input thumb across all browsers */}
                        <style dangerouslySetInnerHTML={{
                            __html: `
                                .voice-player input[type="range"]::-webkit-slider-thumb {
                                    -webkit-appearance: none;
                                    appearance: none;
                                    height: 0;
                                    width: 0;
                                    opacity: 0;
                                }
                                .voice-player input[type="range"]::-moz-range-thumb {
                                    appearance: none;
                                    height: 0;
                                    width: 0;
                                    opacity: 0;
                                    border: none;
                                    background: transparent;
                                }
                                .voice-player input[type="range"]::-ms-thumb {
                                    appearance: none;
                                    height: 0;
                                    width: 0;
                                    opacity: 0;
                                    border: none;
                                    background: transparent;
                                }
                            `
                        }} />
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