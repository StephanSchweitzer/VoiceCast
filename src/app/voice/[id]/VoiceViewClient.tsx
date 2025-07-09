'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    Trash2,
    Settings,
    Download,
    Play
} from 'lucide-react';
import VoicePlayer from '@/components/voice/VoicePlayer';
import DeleteVoiceButton from '@/components/voice/DeleteVoiceButton';
import { VoiceWithUser } from '@/types/voice';
// Removed @gradio/client import - now using API route

interface VoiceViewClientProps {
    voiceId: string;
    userId: string;
}

interface TTSParameters {
    exaggeration: number;
    temperature: number;
    seed: number;
    cfgw: number;
}

function VoiceViewSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header Card Skeleton */}
            <Card>
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
            <Card>
                <CardHeader>
                    <div className="h-6 w-full max-w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </CardHeader>
                <CardContent>
                    <div className="h-16 w-full bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                </CardContent>
            </Card>

            {/* TTS Card Skeleton */}
            <Card>
                <CardHeader>
                    <div className="h-6 w-full max-w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="h-24 w-full bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                    <div className="flex justify-end">
                        <div className="h-9 w-32 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Error component
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <Card className="border-red-200 dark:border-red-800">
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
    const [ttsText, setTtsText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
    const [ttsError, setTtsError] = useState<string | null>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const router = useRouter();

    // TTS Parameters
    const [ttsParams, setTtsParams] = useState<TTSParameters>({
        exaggeration: 0.5,
        temperature: 0.8,
        seed: 0,
        cfgw: 0.5
    });

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
        if (!ttsText.trim() || !voice || !voice.audioSample) return;

        setIsGenerating(true);
        setTtsError(null);
        setGeneratedAudioUrl(null);

        try {
            // Call our API route instead of Gradio directly
            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: ttsText,
                    audioSampleUrl: voice.audioSample,
                    exaggeration: ttsParams.exaggeration,
                    temperature: ttsParams.temperature,
                    seed: ttsParams.seed,
                    cfgw: ttsParams.cfgw,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to generate speech');
            }

            if (result.success && result.audioUrl) {
                setGeneratedAudioUrl(result.audioUrl);
            } else {
                throw new Error('No audio URL received from the API');
            }

        } catch (error) {
            console.error('Error generating speech:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to generate speech';
            setTtsError(errorMessage);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadAudio = async () => {
        if (!generatedAudioUrl) return;

        try {
            const response = await fetch(generatedAudioUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `${voice?.name || 'generated'}_tts_${Date.now()}.wav`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading audio:', error);
        }
    };

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
                        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
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
                                    <Button variant="outline" size="sm" asChild className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800">
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

                    {/* Header Card with Voice Information */}
                    <Card className="overflow-hidden">
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
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Volume2 className="h-5 w-5" />
                                Voice Sample
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="p-6 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800">
                                <VoicePlayer audioUrl={voice.audioSample} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Text-to-Speech Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Text-to-Speech</CardTitle>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Type or paste text below to convert it to speech using this voice. Maximum 300 characters.
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea
                                rows={4}
                                placeholder="Enter text to convert to speech..."
                                className="resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={ttsText}
                                onChange={(e) => setTtsText(e.target.value.slice(0, 300))}
                                maxLength={300}
                            />

                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {ttsText.length}/300 characters
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                >
                                    {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
                                </Button>
                            </div>

                            {/* Advanced Settings */}
                            {showAdvanced && (
                                <div className="border rounded-lg p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                                    <h4 className="font-medium text-sm">Advanced Parameters</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="exaggeration" className="text-xs">
                                                Exaggeration: {ttsParams.exaggeration}
                                            </Label>
                                            <Slider
                                                id="exaggeration"
                                                min={0}
                                                max={1}
                                                step={0.05}
                                                value={[ttsParams.exaggeration]}
                                                onValueChange={([value]) =>
                                                    setTtsParams(prev => ({ ...prev, exaggeration: value }))
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="temperature" className="text-xs">
                                                Temperature: {ttsParams.temperature}
                                            </Label>
                                            <Slider
                                                id="temperature"
                                                min={0}
                                                max={1}
                                                step={0.05}
                                                value={[ttsParams.temperature]}
                                                onValueChange={([value]) =>
                                                    setTtsParams(prev => ({ ...prev, temperature: value }))
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="seed" className="text-xs">
                                                Random Seed (0 for random)
                                            </Label>
                                            <Input
                                                id="seed"
                                                type="number"
                                                min={0}
                                                value={ttsParams.seed}
                                                onChange={(e) =>
                                                    setTtsParams(prev => ({ ...prev, seed: parseInt(e.target.value) || 0 }))
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="cfgw" className="text-xs">
                                                CFG/Pace: {ttsParams.cfgw}
                                            </Label>
                                            <Slider
                                                id="cfgw"
                                                min={0}
                                                max={1}
                                                step={0.05}
                                                value={[ttsParams.cfgw]}
                                                onValueChange={([value]) =>
                                                    setTtsParams(prev => ({ ...prev, cfgw: value }))
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {ttsError && (
                                <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                        <span className="text-sm text-red-700 dark:text-red-300">{ttsError}</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end">
                                <Button
                                    onClick={handleGenerateSpeech}
                                    disabled={!ttsText.trim() || isGenerating || !voice.audioSample}
                                    className="w-full h-10 text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 hover:border-blue-700 shadow-sm disabled:bg-gray-400 disabled:border-gray-400 disabled:text-white disabled:cursor-not-allowed"
                                >
                                    {isGenerating ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Generating...
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Volume2 className="h-4 w-4" />
                                            Generate Speech
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Generated Audio Card */}
                    {generatedAudioUrl && (
                        <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg text-green-900 dark:text-green-100">
                                    <Play className="h-5 w-5" />
                                    Generated Audio
                                </CardTitle>
                                <p className="text-sm text-green-700 dark:text-green-300">
                                    Your text has been successfully converted to speech using this voice.
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 rounded-lg bg-white dark:bg-gray-900 border">
                                    <VoicePlayer audioUrl={generatedAudioUrl} />
                                </div>
                                <div className="flex justify-end">
                                    <Button
                                        onClick={handleDownloadAudio}
                                        variant="outline"
                                        size="sm"
                                        className="flex items-center gap-2"
                                    >
                                        <Download className="h-4 w-4" />
                                        Download Audio
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}