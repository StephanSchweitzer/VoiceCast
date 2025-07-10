'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Loader2,
    AlertCircle,
    Volume2
} from 'lucide-react';
import { Emotion } from '@/types/speak';

const EMOTIONS: Emotion[] = [
    { name: 'neutral', icon: '😐', label: 'Neutral', color: 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300' },
    { name: 'happy', icon: '😊', label: 'Happy', color: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700 dark:bg-yellow-800 dark:hover:bg-yellow-700 dark:text-yellow-300' },
    { name: 'sad', icon: '😢', label: 'Sad', color: 'bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-800 dark:hover:bg-blue-700 dark:text-blue-300' },
    { name: 'angry', icon: '😠', label: 'Angry', color: 'bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-800 dark:hover:bg-red-700 dark:text-red-300' },
    { name: 'fearful', icon: '😨', label: 'Fearful', color: 'bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-800 dark:hover:bg-purple-700 dark:text-purple-300' },
    { name: 'surprised', icon: '😲', label: 'Surprised', color: 'bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-800 dark:hover:bg-green-700 dark:text-green-300' }
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
    disabled?: boolean;
    placeholder?: string;
}

export default function TextInput({ selectedVoiceId, onGenerate, disabled, placeholder }: TextInputProps) {
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
        <Card className="p-0">
            <CardContent className="space-y-2 p-3">
                {/* Emotion Selection - Compact horizontal layout */}
                <div className="grid grid-cols-6 gap-2">
                    {EMOTIONS.map((emotion) => {
                        const isSelected = selectedEmotion === emotion.name;
                        return (
                            <Button
                                key={emotion.name}
                                size="sm"
                                onClick={() => setSelectedEmotion(emotion.name)}
                                className={`flex items-center justify-center h-8 px-2 transition-all duration-300 ease-in-out ${
                                    isSelected
                                        ? SELECTED_COLORS[emotion.name as keyof typeof SELECTED_COLORS]
                                        : `${emotion.color} border border-transparent hover:border-gray-300 dark:hover:border-gray-600`
                                }`}
                                variant={isSelected ? "default" : "outline"}
                                disabled={disabled}
                                title={emotion.label}
                            >
                                <span className="text-base">{emotion.icon}</span>
                            </Button>
                        );
                    })}
                </div>

                {/* Text Area - Compact */}
                <Textarea
                    rows={2}
                    placeholder={placeholder || "Enter text to generate speech..."}
                    className="resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm md:text-base"
                    value={text}
                    onChange={(e) => setText(e.target.value.slice(0, 300))}
                    maxLength={300}
                    disabled={disabled}
                />

                {generationError && (
                    <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <span className="text-sm text-red-700 dark:text-red-300">{generationError}</span>
                        </div>
                    </div>
                )}

                {/* Bottom Row - Character count and Generate Button */}
                <div className="flex justify-between items-center gap-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                        {text.length}/300
                    </span>
                    <Button
                        onClick={handleGenerate}
                        disabled={!text.trim() || !selectedVoiceId || isGenerating || disabled}
                        className="flex-1 h-9 text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 hover:border-blue-700 shadow-sm disabled:bg-gray-400 disabled:border-gray-400 disabled:text-white disabled:cursor-not-allowed"
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