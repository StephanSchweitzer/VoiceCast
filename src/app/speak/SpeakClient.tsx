'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, MessageSquarePlus } from 'lucide-react';
import VoiceSelection from './components/VoiceSelection';
import TextInput from './components/TextInput';
import GeneratedAudioList from './components/GeneratedAudioList';
import ErrorState from './components/ErrorState';
import SpeakSkeleton from './components/SpeakSkeleton';
import { SpeakVoice, GeneratedAudio, SpeakSession } from '@/types/speak';

interface SpeakClientProps {
    userId: string;
    mode: 'new' | 'session';
    sessionId?: string; // Required when mode is 'session'
}

export default function SpeakClient({ userId, mode, sessionId }: SpeakClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Voice state
    const [userVoices, setUserVoices] = useState<SpeakVoice[]>([]);
    const [savedVoices, setSavedVoices] = useState<SpeakVoice[]>([]);
    const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');

    // Session state
    const [currentSession, setCurrentSession] = useState<SpeakSession | null>(null);
    const [generatedAudios, setGeneratedAudios] = useState<GeneratedAudio[]>([]);

    // Loading state
    const [loadingVoices, setLoadingVoices] = useState(true);
    const [loadingSession, setLoadingSession] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pagination state
    const [hasMore, setHasMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);

    // Refs
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Load voices on mount (always needed)
    const loadVoices = async (signal?: AbortSignal) => {
        try {
            const [userVoicesRes, savedVoicesRes] = await Promise.all([
                fetch('/api/voices?type=user', { signal }),
                fetch('/api/saved-voices', { signal })
            ]);

            if (!userVoicesRes.ok || !savedVoicesRes.ok) {
                throw new Error('Failed to load voices');
            }

            const [userVoicesData, savedVoicesData] = await Promise.all([
                userVoicesRes.json(),
                savedVoicesRes.json()
            ]);

            setUserVoices(userVoicesData);
            setSavedVoices(savedVoicesData);

            // Check for voice parameter in URL first
            const urlVoiceId = searchParams.get('voice');
            let voiceToSelect = '';

            if (urlVoiceId) {
                // Check if the URL voice exists in user voices or saved voices
                const allVoices = [...userVoicesData, ...savedVoicesData];
                const foundVoice = allVoices.find(voice => voice.id === urlVoiceId);

                if (foundVoice) {
                    voiceToSelect = urlVoiceId;
                } else {
                    // Voice from URL not found in user's collection, fall back to default
                    console.warn(`Voice ${urlVoiceId} not found in user's voices`);
                }
            }

            // If no URL voice or URL voice not found, use default selection
            if (!voiceToSelect) {
                if (userVoicesData.length > 0) {
                    voiceToSelect = userVoicesData[0].id;
                } else if (savedVoicesData.length > 0) {
                    voiceToSelect = savedVoicesData[0].id;
                }
            }

            if (voiceToSelect) {
                setSelectedVoiceId(voiceToSelect);
            }

        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                return;
            }
            throw err;
        }
    };

    // Load existing session (only in session mode)
    const loadSession = async (sessionId: string, signal?: AbortSignal) => {
        try {
            setLoadingSession(true);

            const response = await fetch(`/api/speak-sessions/${sessionId}?limit=15`, {
                signal
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Session not found');
                }
                throw new Error('Failed to load session');
            }

            const data = await response.json();

            setCurrentSession(data.session);
            setGeneratedAudios(data.audios || []);
            setHasMore(data.hasMore || false);
            setNextCursor(data.nextCursor);
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                return;
            }
            throw err;
        } finally {
            setLoadingSession(false);
        }
    };

    // Create new session (only when user generates first audio)
    const createNewSession = async (name?: string) => {
        const response = await fetch('/api/speak-sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }), // Will auto-generate name if not provided
        });

        if (!response.ok) {
            throw new Error('Failed to create session');
        }

        return await response.json();
    };

    // Initialize voices on mount
    useEffect(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        const init = async () => {
            try {
                setLoadingVoices(true);
                setError(null);
                await loadVoices(abortController.signal);
            } catch (err) {
                console.error('Error loading voices:', err);
                setError('Failed to load voices. Please try again.');
            } finally {
                setLoadingVoices(false);
            }
        };

        init();

        return () => {
            abortController.abort();
        };
    }, [searchParams]); // Add searchParams as dependency to re-run when URL changes

    // Load session if in session mode
    useEffect(() => {
        if (mode === 'session' && sessionId && !loadingVoices) {
            const abortController = new AbortController();

            const load = async () => {
                try {
                    setError(null);
                    await loadSession(sessionId, abortController.signal);
                } catch (err) {
                    console.error('Error loading session:', err);
                    if (err instanceof Error && err.message === 'Session not found') {
                        setError('Session not found. Redirecting to new conversation...');
                        setTimeout(() => router.push('/speak'), 2000);
                    } else {
                        setError('Failed to load session. Please try again.');
                    }
                }
            };

            load();

            return () => {
                abortController.abort();
            };
        }
    }, [mode, sessionId, loadingVoices, router]);

    // Handle audio generation
    const handleGenerate = async (text: string, emotion: string) => {
        if (!selectedVoiceId) return null;

        try {
            // If in new mode, create session first
            if (mode === 'new' && !currentSession) {
                const session = await createNewSession();
                setCurrentSession(session);

                // Generate the audio with the new session
                const response = await fetch('/api/generated-audio', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: text.trim(),
                        voiceId: selectedVoiceId,
                        emotion,
                        sessionId: session.id
                    }),
                });

                const result = await response.json();
                if (!response.ok) throw new Error(result.message || 'Failed to generate speech');

                setGeneratedAudios([result]);

                // Auto-play the generated audio
                if (audioRef.current) {
                    audioRef.current.src = result.filePath;
                    audioRef.current.play().catch(console.error);
                }

                // Navigate to the session URL (remove voice parameter from URL)
                router.push(`/speak/session/${session.id}`);

                return result;
            } else if (currentSession) {
                const response = await fetch('/api/generated-audio', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: text.trim(),
                        voiceId: selectedVoiceId,
                        emotion,
                        sessionId: currentSession?.id || "you don't have it"
                    }),
                });

                const result = await response.json();
                if (!response.ok) throw new Error(result.message || 'Failed to generate speech');

                setGeneratedAudios(prev => [result, ...prev]);

                // Auto-play the generated audio
                if (audioRef.current) {
                    audioRef.current.src = result.filePath;
                    audioRef.current.play().catch(console.error);
                }

                return result;
            }
        } catch (err) {
            console.error('Error generating audio:', err);
            throw err;
        }
    };

    // Handle pagination
    const handleLoadMore = async () => {
        if (!hasMore || !nextCursor || !currentSession) return;

        const response = await fetch(`/api/speak-sessions/${currentSession.id}?limit=15&cursor=${nextCursor}`);
        const data = await response.json();

        setGeneratedAudios(prev => [...prev, ...data.audios]);
        setHasMore(data.hasMore);
        setNextCursor(data.nextCursor);
    };

    // Handle audio updates
    const handleUpdateAudio = (audioId: string, updates: Partial<GeneratedAudio>) => {
        setGeneratedAudios(prev =>
            prev.map(audio => audio.id === audioId ? { ...audio, ...updates } : audio)
        );
    };

    const handleDeleteAudio = (audioId: string) => {
        setGeneratedAudios(prev => prev.filter(audio => audio.id !== audioId));
    };

    // Loading state
    if (loadingVoices || (mode === 'session' && loadingSession)) {
        return (
            <div>
                <SpeakSkeleton />
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <ErrorState
                message={error}
                onRetry={() => {
                    setError(null);
                    if (mode === 'session' && sessionId) {
                        loadSession(sessionId);
                    } else {
                        loadVoices();
                    }
                }}
            />
        );
    }

    // No voices available
    const hasVoices = userVoices.length > 0 || savedVoices.length > 0;

    // Get the selected voice name for display
    const allVoices = [...userVoices, ...savedVoices];
    const selectedVoice = allVoices.find(voice => voice.id === selectedVoiceId);
    const urlVoiceId = searchParams.get('voice');

    return (
        <div className="h-[calc(100vh-60px)] flex flex-col">
            {/* Hidden audio element for auto-play */}
            <audio ref={audioRef} preload="none" />

            {/* Session Header - Reduced padding */}
            <div className="px-3 py-1 bg-gray-50 dark:bg-gray-900 rounded text-center flex-shrink-0">
                <h2 className="text-sm font-medium text-gray-900 dark:text-white">
                    {mode === 'new' ? (
                        <span className="flex items-center justify-center gap-2">
                        <MessageSquarePlus className="h-4 w-4" />
                            {urlVoiceId && selectedVoice ?
                                `New Conversation with ${selectedVoice.name}` :
                                'New Conversation'
                            }
                    </span>
                    ) : (
                        currentSession?.name || 'Loading...'
                    )}
                </h2>
            </div>

            {/* Voice Selection */}
            <div className="flex-shrink-0 mt-2">
                <VoiceSelection
                    userVoices={userVoices}
                    savedVoices={savedVoices}
                    selectedVoiceId={selectedVoiceId}
                    onVoiceSelect={setSelectedVoiceId}
                />
            </div>

            {/* Generated Audio List - Reduced spacing */}
            <div className="flex-1 min-h-0 rounded-lg overflow-hidden mt-2">
                {mode === 'new' && generatedAudios.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        <MessageSquarePlus className="h-10 w-10 text-gray-400 mb-3" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            {urlVoiceId && selectedVoice ?
                                `Start Speaking with ${selectedVoice.name}` :
                                'Start a New Conversation'
                            }
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                            {hasVoices
                                ? "Type a message below to generate your first audio. A new session will be created automatically."
                                : "Please create or save a voice first to start generating audio."
                            }
                        </p>
                    </div>
                ) : (
                    <GeneratedAudioList
                        audios={generatedAudios}
                        hasMore={hasMore}
                        onLoadMore={handleLoadMore}
                        onUpdateAudio={handleUpdateAudio}
                        onDeleteAudio={handleDeleteAudio}
                    />
                )}
            </div>

            {/* Text Input */}
            <div className="flex-shrink-0 mt-2">
                <TextInput
                    selectedVoiceId={selectedVoiceId}
                    onGenerate={handleGenerate}
                    disabled={!hasVoices}
                    placeholder={
                        mode === 'new'
                            ? urlVoiceId && selectedVoice
                                ? `Type a message to start speaking with ${selectedVoice.name}...`
                                : "Type a message to start a new conversation..."
                            : "Type a message..."
                    }
                />
            </div>
        </div>
    );
}