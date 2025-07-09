'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Loader2,
    AlertCircle,
    Volume2,
    Heart,
    Frown,
    Angry,
    Zap,
    Sparkles,
    Meh
} from 'lucide-react';
import { Emotion } from '@/types/speak';

const EMOTIONS: Emotion[] = [
    { name: 'neutral', icon: Meh, label: 'Neutral', color: 'bg-gray-100 hover:bg-gray-200 text-gray-700' },
    { name: 'happy', icon: Heart, label: 'Happy', color: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700' },
    { name: 'sad', icon: Frown, label: 'Sad', color: 'bg-blue-100 hover:bg-blue-200 text-blue-700' },
    { name: 'angry', icon: Angry, label: 'Angry', color: 'bg-red-100 hover:bg-red-200 text-red-700' },
    { name: 'fearful', icon: Zap, label: 'Fearful', color: 'bg-purple-100 hover:bg-purple-200 text-purple-700' },
    { name: 'surprised', icon: Sparkles, label: 'Surprised', color: 'bg-green-100 hover:bg-green-200 text-green-700' }
];

interface TextInputProps {
    selectedVoiceId: string;
    onGenerate: (text: string, emotion: string) => Promise<any>;
    disabled: boolean;
}

export default function TextInput({ selectedVoiceId, onGenerate, disabled }: TextInputProps) {
    const [text, setText] = useState('');
    const [selectedEmotion, setSelectedEmotion] = useState<string>('neutral');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!text.trim() || !selectedVoiceId) return;

        setIsGenerating(true);
        setGenerationError(null);

        try {
            await onGenerate(text, selectedEmotion);
            setText(''); // Clear text on success
        } catch (error) {
            console.error('Error generating speech:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to generate speech';
            setGenerationError(errorMessage);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Generate Speech</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Type your message and choose an emotion. Maximum 300 characters.
                </p>
            </CardHeader>
            <CardContent className="space-y-4">
                <Textarea
                    rows={4}
                    placeholder="Type what you want to say..."
                    className="resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={text}
                    onChange={(e) => setText(e.target.value.slice(0, 300))}
                    maxLength={300}
                    disabled={disabled}
                />

                <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {text.length}/300 characters
                    </span>
                </div>

                {/* Emotion Selection */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Choose Emotion
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {EMOTIONS.map((emotion) => {
                            const Icon = emotion.icon;
                            const isSelected = selectedEmotion === emotion.name;
                            return (
                                <Button
                                    key={emotion.name}
                                    variant={isSelected ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSelectedEmotion(emotion.name)}
                                    className={`flex items-center gap-2 ${!isSelected ? emotion.color : ''}`}
                                    disabled={disabled}
                                >
                                    <Icon className="h-4 w-4" />
                                    {emotion.label}
                                </Button>
                            );
                        })}
                    </div>
                </div>

                {generationError && (
                    <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <span className="text-sm text-red-700 dark:text-red-300">{generationError}</span>
                        </div>
                    </div>
                )}

                <div className="flex justify-end">
                    <Button
                        onClick={handleGenerate}
                        disabled={!text.trim() || !selectedVoiceId || isGenerating || disabled}
                        className="min-w-[140px]"
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
    );
}