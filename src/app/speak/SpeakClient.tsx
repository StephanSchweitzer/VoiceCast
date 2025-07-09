'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import VoiceSelection from './components/VoiceSelection';
import TextInput from './components/TextInput';
import GeneratedAudioList from './components/GeneratedAudioList';
import ErrorState from './components/ErrorState';
import SpeakSkeleton from './components/SpeakSkeleton';
import { SpeakVoice, GeneratedAudio, Emotion } from '@/types/speak';

interface SpeakClientProps {
    userId: string;
}

export default function SpeakClient({ userId }: SpeakClientProps) {
    const [userVoices, setUserVoices] = useState<SpeakVoice[]>([]);
    const [savedVoices, setSavedVoices] = useState<SpeakVoice[]>([]);
    const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');
    const [generatedAudios, setGeneratedAudios] = useState<GeneratedAudio[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [userVoicesRes, savedVoicesRes, generatedAudioRes] = await Promise.all([
                fetch('/api/voices?type=user'),
                fetch('/api/saved-voices'),
                fetch('/api/generated-audio?limit=15')
            ]);

            if (!userVoicesRes.ok || !savedVoicesRes.ok || !generatedAudioRes.ok) {
                throw new Error('Failed to load data');
            }

            const [userVoicesData, savedVoicesData, generatedAudioData] = await Promise.all([
                userVoicesRes.json(),
                savedVoicesRes.json(),
                generatedAudioRes.json()
            ]);

            setUserVoices(userVoicesData);
            setSavedVoices(savedVoicesData);
            setGeneratedAudios(generatedAudioData.audios || []);
            setHasMore(generatedAudioData.hasMore || false);
            setNextCursor(generatedAudioData.nextCursor);

            if (userVoicesData.length > 0) {
                setSelectedVoiceId(userVoicesData[0].id);
            } else if (savedVoicesData.length > 0) {
                setSelectedVoiceId(savedVoicesData[0].id);
            }

        } catch (err) {
            console.error('Error loading initial data:', err);
            setError('Failed to load data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async (text: string, emotion: string) => {
        if (!selectedVoiceId) return null;

        const response = await fetch('/api/generated-audio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: text.trim(),
                voiceId: selectedVoiceId,
                emotion
            }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Failed to generate speech');

        setGeneratedAudios(prev => [result, ...prev]);

        if (audioRef.current) {
            audioRef.current.src = result.filePath;
            audioRef.current.play().catch(console.error);
        }

        return result;
    };

    const handleLoadMore = async () => {
        if (!hasMore || !nextCursor) return;

        const response = await fetch(`/api/generated-audio?limit=15&cursor=${nextCursor}`);
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
    }, []);

    if (loading) {
        return (
            <div>
                <div className="flex items-center justify-center mb-6">
                    <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                    <span className="text-sm text-muted-foreground">Loading voices...</span>
                </div>
                <SpeakSkeleton />
            </div>
        );
    }

    if (error) {
        return <ErrorState message={error} onRetry={loadInitialData} />;
    }

    return (
        <div className="space-y-6">
            {/* Hidden audio element for auto-play */}
            <audio ref={audioRef} preload="none" />

            <VoiceSelection
                userVoices={userVoices}
                savedVoices={savedVoices}
                selectedVoiceId={selectedVoiceId}
                onVoiceSelect={setSelectedVoiceId}
            />

            <TextInput
                selectedVoiceId={selectedVoiceId}
                onGenerate={handleGenerate}
                disabled={userVoices.length === 0 && savedVoices.length === 0}
            />

            <GeneratedAudioList
                audios={generatedAudios}
                hasMore={hasMore}
                onLoadMore={handleLoadMore}
                onUpdateAudio={handleUpdateAudio}
                onDeleteAudio={handleDeleteAudio}
            />
        </div>
    );
}