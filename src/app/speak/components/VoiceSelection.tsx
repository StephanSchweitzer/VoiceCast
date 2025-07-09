'use client';

import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Voice } from '@/types/voice';

interface VoiceSelectionProps {
    userVoices: Voice[];
    savedVoices: Voice[];
    selectedVoiceId: string;
    onVoiceSelect: (voiceId: string) => void;
}

export default function VoiceSelection({
                                           userVoices,
                                           savedVoices,
                                           selectedVoiceId,
                                           onVoiceSelect
                                       }: VoiceSelectionProps) {
    const allVoicesEmpty = userVoices.length === 0 && savedVoices.length === 0;

    if (allVoicesEmpty) {
        return (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 text-center">
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                    You don't have any voices yet. Create or save some voices to get started.
                </p>
                <Button asChild variant="outline" size="sm">
                    <a href="/voice">Browse Voices</a>
                </Button>
            </div>
        );
    }

    return (
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-3">
                {/* User Voices */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        My Voices ({userVoices.length})
                    </label>
                    <Select
                        value={userVoices.some(v => v.id === selectedVoiceId) ? selectedVoiceId : ''}
                        onValueChange={onVoiceSelect}
                    >
                        <SelectTrigger className="w-full h-9 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 shadow-sm">
                            <SelectValue placeholder="Select your voice" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 shadow-lg">
                            {userVoices.map((voice) => (
                                <SelectItem key={voice.id} value={voice.id}>
                                    {voice.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Saved Voices */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Saved Voices ({savedVoices.length})
                    </label>
                    <Select
                        value={savedVoices.some(v => v.id === selectedVoiceId) ? selectedVoiceId : ''}
                        onValueChange={onVoiceSelect}
                    >
                        <SelectTrigger className="w-full h-9 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 shadow-sm">
                            <SelectValue placeholder="Select saved voice" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 shadow-lg">
                            {savedVoices.map((voice) => (
                                <SelectItem key={voice.id} value={voice.id}>
                                    {voice.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}