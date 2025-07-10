'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import VoiceSelection from './components/VoiceSelection';
import TextInput from './components/TextInput';
import GeneratedAudioList from './components/GeneratedAudioList';
import ErrorState from './components/ErrorState';
import SpeakSkeleton from './components/SpeakSkeleton';
import { SpeakVoice, GeneratedAudio, SpeakSession } from '@/types/speak';

interface SpeakClientProps {
    userId: string;
    sessionId?: string; // Optional - if not provided, creates new session
}

export default function SpeakClient({ userId, sessionId }: SpeakClientProps) {
    const [userVoices, setUserVoices] = useState<SpeakVoice[]>([]);
    const [savedVoices, setSavedVoices] = useState<SpeakVoice[]>([]);
    const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');
    const [generatedAudios, setGeneratedAudios] = useState<GeneratedAudio[]>([]);
    const [currentSession, setCurrentSession] = useState<SpeakSession | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    const createNewSession = async () => {
        const response = await fetch('/api/speak-sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}) // Will auto-generate name
        });

        if (!response.ok) {
            throw new Error('Failed to create session');
        }

        return await response.json();
    };

    const loadSession = async (sessionId: string) => {
        const response = await fetch(`/api/speak-sessions/${sessionId}?limit=15`);

        if (!response.ok) {
            throw new Error('Failed to load session');
        }

        return await response.json();
    };

    const loadVoices = async () => {
        const [userVoicesRes, savedVoicesRes] = await Promise.all([
            fetch('/api/voices?type=user'),
            fetch('/api/saved-voices')
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

        // Set default voice selection
        if (userVoicesData.length > 0) {
            setSelectedVoiceId(userVoicesData[0].id);
        } else if (savedVoicesData.length > 0) {
            setSelectedVoiceId(savedVoicesData[0].id);
        }
    };

    const loadInitialData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load voices first
            await loadVoices();

            let session;
            if (sessionId) {
                // Load existing session
                const sessionData = await loadSession(sessionId);
                session = sessionData.session;
                setGeneratedAudios(sessionData.audios || []);
                setHasMore(sessionData.hasMore || false);
                setNextCursor(sessionData.nextCursor);
            } else {
                // Create new session
                session = await createNewSession();
                setGeneratedAudios([]);
                setHasMore(false);
                setNextCursor(null);
            }

            setCurrentSession(session);

            // Update URL without reload if we created a new session
            if (!sessionId && session.id) {
                window.history.replaceState(null, '', `/speak?session=${session.id}`);
            }

        } catch (err) {
            console.error('Error loading initial data:', err);
            setError('Failed to load data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async (text: string, emotion: string) => {
        if (!selectedVoiceId || !currentSession) return null;

        const response = await fetch('/api/generated-audio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: text.trim(),
                voiceId: selectedVoiceId,
                emotion,
                sessionId: currentSession.id
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
    };

    const handleLoadMore = async () => {
        if (!hasMore || !nextCursor || !currentSession) return;

        const response = await fetch(`/api/speak-sessions/${currentSession.id}?limit=15&cursor=${nextCursor}`);
        const data = await response.json();

        setGeneratedAudios(prev => [...prev, ...data.audios]);
        setHasMore(data.hasMore);
        setNextCursor(data.nextCursor);
    };

    const handleUpdateAudio = (audioId: string, updates: Partial<GeneratedAudio>) => {
        setGeneratedAudios(prev =>
            prev.map(audio => audio.id === audioId ? { ...audio, ...updates } : audio)
        );
    };

    const handleDeleteAudio = (audioId: string) => {
        setGeneratedAudios(prev => prev.filter(audio => audio.id !== audioId));
    };

    useEffect(() => {
        loadInitialData();
    }, [sessionId]);

    if (loading) {
        return (
            <div>
                <div className="flex items-center justify-center mb-6">
                    <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                    <span className="text-sm text-muted-foreground">
                        {sessionId ? 'Loading session...' : 'Creating new session...'}
                    </span>
                </div>
                <SpeakSkeleton />
            </div>
        );
    }

    if (error) {
        return <ErrorState message={error} onRetry={loadInitialData} />;
    }

    return (
        <div className="-mt-4 h-[calc(100vh-120px)] flex flex-col space-y-2">
            {/* Hidden audio element for auto-play */}
            <audio ref={audioRef} preload="none" />

            {/* Session Header - Minimal */}
            {currentSession && (
                <div className="px-3 py-1 bg-gray-50 dark:bg-gray-900 rounded text-center">
                    <h2 className="text-sm font-medium text-gray-900 dark:text-white">
                        {currentSession.name}
                    </h2>
                </div>
            )}

            {/* Voice Selection - Compact */}
            <div className="flex-shrink-0">
                <VoiceSelection
                    userVoices={userVoices}
                    savedVoices={savedVoices}
                    selectedVoiceId={selectedVoiceId}
                    onVoiceSelect={setSelectedVoiceId}
                />
            </div>

            {/* Generated Audio List - MAXIMIZED main section */}
            <div className="flex-1 min-h-0 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <GeneratedAudioList
                    audios={generatedAudios}
                    hasMore={hasMore}
                    onLoadMore={handleLoadMore}
                    onUpdateAudio={handleUpdateAudio}
                    onDeleteAudio={handleDeleteAudio}
                />
            </div>

            {/* Text Input - Compact at bottom */}
            <div className="flex-shrink-0">
                <TextInput
                    selectedVoiceId={selectedVoiceId}
                    onGenerate={handleGenerate}
                    disabled={userVoices.length === 0 && savedVoices.length === 0}
                />
            </div>
        </div>
    );
}