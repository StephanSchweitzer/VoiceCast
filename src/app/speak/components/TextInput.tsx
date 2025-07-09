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
    { name: 'neutral', icon: Meh, label: 'Neutral', color: 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300' },
    { name: 'happy', icon: Heart, label: 'Happy', color: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700 dark:bg-yellow-800 dark:hover:bg-yellow-700 dark:text-yellow-300' },
    { name: 'sad', icon: Frown, label: 'Sad', color: 'bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-800 dark:hover:bg-blue-700 dark:text-blue-300' },
    { name: 'angry', icon: Angry, label: 'Angry', color: 'bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-800 dark:hover:bg-red-700 dark:text-red-300' },
    { name: 'fearful', icon: Zap, label: 'Fearful', color: 'bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-800 dark:hover:bg-purple-700 dark:text-purple-300' },
    { name: 'surprised', icon: Sparkles, label: 'Surprised', color: 'bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-800 dark:hover:bg-green-700 dark:text-green-300' }
];

const SELECTED_COLORS = {
    neutral: 'bg-gray-500 text-white dark:bg-gray-600',
    happy: 'bg-yellow-500 text-white dark:bg-yellow-600',
    sad: 'bg-blue-500 text-white dark:bg-blue-600',
    angry: 'bg-red-500 text-white dark:bg-red-600',
    fearful: 'bg-purple-500 text-white dark:bg-purple-600',
    surprised: 'bg-green-500 text-white dark:bg-green-600'
};

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
            <CardContent className="space-y-4">
                {/* Emotion Selection - Above text */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Choose Emotion
                    </label>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {EMOTIONS.map((emotion) => {
                            const Icon = emotion.icon;
                            const isSelected = selectedEmotion === emotion.name;
                            return (
                                <Button
                                    key={emotion.name}
                                    size="sm"
                                    onClick={() => setSelectedEmotion(emotion.name)}
                                    className={`flex flex-col items-center gap-1 h-12 px-2 transition-all duration-300 ease-in-out ${
                                        isSelected
                                            ? SELECTED_COLORS[emotion.name as keyof typeof SELECTED_COLORS]
                                            : `${emotion.color} border border-transparent hover:border-gray-300 dark:hover:border-gray-600`
                                    }`}
                                    variant={isSelected ? "default" : "outline"}
                                    disabled={disabled}
                                >
                                    <Icon className="h-3 w-3" />
                                    <span className="text-xs">{emotion.label}</span>
                                </Button>
                            );
                        })}
                    </div>
                </div>

                {/* Text Area */}
                <div className="space-y-2">
                    <Textarea
                        rows={4}
                        placeholder="Type what you want to say..."
                        className="resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
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
                </div>

                {generationError && (
                    <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <span className="text-sm text-red-700 dark:text-red-300">{generationError}</span>
                        </div>
                    </div>
                )}

                {/* Generate Button */}
                <Button
                    onClick={handleGenerate}
                    disabled={!text.trim() || !selectedVoiceId || isGenerating || disabled}
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
            </CardContent>
        </Card>
    );
}