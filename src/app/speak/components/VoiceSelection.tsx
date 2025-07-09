'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { User } from 'lucide-react';
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

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Select Voice
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Choose a voice from your collection or saved community voices.
                </p>
            </CardHeader>
            <CardContent>
                {allVoicesEmpty ? (
                    <div className="text-center py-8">
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            You don't have any voices yet. Create or save some voices to get started.
                        </p>
                        <Button asChild variant="outline">
                            <a href="/voice">Browse Voices</a>
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* User Voices */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                My Voices ({userVoices.length})
                            </label>
                            <Select
                                value={userVoices.some(v => v.id === selectedVoiceId) ? selectedVoiceId : ''}
                                onValueChange={onVoiceSelect}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select your voice" />
                                </SelectTrigger>
                                <SelectContent>
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
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Saved Voices ({savedVoices.length})
                            </label>
                            <Select
                                value={savedVoices.some(v => v.id === selectedVoiceId) ? selectedVoiceId : ''}
                                onValueChange={onVoiceSelect}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select saved voice" />
                                </SelectTrigger>
                                <SelectContent>
                                    {savedVoices.map((voice) => (
                                        <SelectItem key={voice.id} value={voice.id}>
                                            {voice.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}