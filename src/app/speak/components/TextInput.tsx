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
    { name: 'happy', icon: '😊', label: 'Happy', color: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800 dark:bg-yellow-900/35 dark:hover:bg-yellow-800/45 dark:text-yellow-300' },
    { name: 'sad', icon: '😢', label: 'Sad', color: 'bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900/35 dark:hover:bg-blue-800/45 dark:text-blue-300' },
    { name: 'angry', icon: '😠', label: 'Angry', color: 'bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900/35 dark:hover:bg-red-800/45 dark:text-red-300' },
    { name: 'fearful', icon: '😨', label: 'Fearful', color: 'bg-purple-100 hover:bg-purple-200 text-purple-800 dark:bg-purple-900/35 dark:hover:bg-purple-800/45 dark:text-purple-300' },
    { name: 'surprised', icon: '😲', label: 'Surprised', color: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-900/35 dark:hover:bg-emerald-800/45 dark:text-emerald-300' }
];

const SELECTED_COLORS = {
    neutral: 'bg-gray-700 text-white shadow-md border-gray-700 dark:bg-gray-400 dark:text-gray-900 dark:border-gray-400',
    happy: 'bg-yellow-600 text-white shadow-md border-yellow-600 dark:bg-yellow-500 dark:text-yellow-900 dark:border-yellow-500',
    sad: 'bg-blue-600 text-white shadow-md border-blue-600 dark:bg-blue-500 dark:text-blue-900 dark:border-blue-500',
    angry: 'bg-red-600 text-white shadow-md border-red-600 dark:bg-red-500 dark:text-red-900 dark:border-red-500',
    fearful: 'bg-purple-600 text-white shadow-md border-purple-600 dark:bg-purple-500 dark:text-purple-900 dark:border-purple-500',
    surprised: 'bg-emerald-600 text-white shadow-md border-emerald-600 dark:bg-emerald-500 dark:text-emerald-900 dark:border-emerald-500'
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
        <Card className="p-0 bg-gray-100 dark:bg-gray-800">
            <CardContent className="space-y-2 p-3">
                {/* Emotion Selection - Compact horizontal layout */}
                <div className="grid grid-cols-6 gap-2">
                    {EMOTIONS.map((emotion) => {
                        const isSelected = selectedEmotion === emotion.name;
                        return (
                            <button
                                key={emotion.name}
                                onClick={() => setSelectedEmotion(emotion.name)}
                                disabled={disabled}
                                title={emotion.label}
                                onMouseDown={(e) => e.preventDefault()}
                                className={`
                                    flex items-center justify-center h-8 px-2 
                                    transition-all duration-200 ease-in-out 
                                    focus:outline-none focus:ring-0 focus:border-transparent
                                    border rounded-md font-medium text-base
                                    ${isSelected ? `
                                        ${SELECTED_COLORS[emotion.name as keyof typeof SELECTED_COLORS]}
                                    ` : `
                                        ${emotion.color} 
                                        border-gray-300 dark:border-gray-600
                                        hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm
                                        active:scale-95
                                    `}
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                `}
                            >
                                <span className="select-none">{emotion.icon}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Text Area - Compact */}
                <Textarea
                    rows={2}
                    placeholder={placeholder || "Enter text to generate speech..."}
                    className="resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-sm md:text-base"
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