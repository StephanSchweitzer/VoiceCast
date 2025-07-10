'use client';

import { Button } from '@/components/ui/button';
import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ChevronDown, ChevronUp, Check, User, Heart, Music } from 'lucide-react';
import { VoiceWithOptionalUser } from '@/types/voice';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface VoiceSelectionProps {
    userVoices: VoiceWithOptionalUser[];
    savedVoices: VoiceWithOptionalUser[];
    selectedVoiceId: string;
    onVoiceSelect: (voiceId: string) => void;
}

interface EnhancedVoice extends VoiceWithOptionalUser {
    type: 'user' | 'saved';
    displayLabel: string;
}

export default function VoiceSelection({
                                           userVoices,
                                           savedVoices,
                                           selectedVoiceId,
                                           onVoiceSelect
                                       }: VoiceSelectionProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const allVoicesEmpty = userVoices.length === 0 && savedVoices.length === 0;

    // Combine and enhance voices with type information
    const enhancedVoices: EnhancedVoice[] = [
        ...userVoices.map(voice => ({
            ...voice,
            type: 'user' as const,
            displayLabel: `${voice.name} (My Voice)`
        })),
        ...savedVoices.map(voice => ({
            ...voice,
            type: 'saved' as const,
            displayLabel: `${voice.name} (Saved)`
        }))
    ];

    // Find the currently selected voice
    const selectedVoice = enhancedVoices.find(v => v.id === selectedVoiceId);

    // Quick stats
    const totalVoices = enhancedVoices.length;
    const userVoiceCount = userVoices.length;
    const savedVoiceCount = savedVoices.length;

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
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Collapsed Header - Always Visible */}
            <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex-1">
                    <div className="flex items-center space-x-2">
                        <Music className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            Voice Library ({totalVoices} voices)
                        </span>
                    </div>
                    {selectedVoice && (
                        <div className="flex items-center space-x-2 mt-1">
                            <div className="flex items-center space-x-1">
                                {selectedVoice.type === 'user' ? (
                                    <User className="h-3 w-3 text-blue-500" />
                                ) : (
                                    <Heart className="h-3 w-3 text-red-500" />
                                )}
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {selectedVoice.name}
                                </span>
                            </div>
                            {selectedVoice.genre && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                                    {selectedVoice.genre.name}
                                </span>
                            )}
                        </div>
                    )}
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                    {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                    ) : (
                        <ChevronDown className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Expanded Content */}
            <div
                className={`transition-all duration-300 ease-in-out ${
                    isExpanded
                        ? 'max-h-96 opacity-100'
                        : 'max-h-0 opacity-0'
                }`}
            >
                <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-600">
                    <div className="pt-3">
                        {/* Stats Row */}
                        <div className="flex items-center justify-between mb-3 text-xs text-gray-600 dark:text-gray-400">
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-1">
                                    <User className="h-3 w-3 text-blue-500" />
                                    <span>{userVoiceCount} My Voices</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <Heart className="h-3 w-3 text-red-500" />
                                    <span>{savedVoiceCount} Saved</span>
                                </div>
                            </div>
                        </div>

                        {/* Searchable Dropdown */}
                        <Popover open={isOpen} onOpenChange={setIsOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={isOpen}
                                    className="w-full justify-between h-11 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm"
                                >
                                    {selectedVoice ? (
                                        <div className="flex items-center space-x-2">
                                            {selectedVoice.type === 'user' ? (
                                                <User className="h-4 w-4 text-blue-500" />
                                            ) : (
                                                <Heart className="h-4 w-4 text-red-500" />
                                            )}
                                            <span>{selectedVoice.name}</span>
                                        </div>
                                    ) : (
                                        "Search and select a voice..."
                                    )}
                                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg" align="start">
                                <Command className="bg-white dark:bg-gray-800 [&_[data-slot=command-input-wrapper]]:border-b-0 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-0 [&_[cmdk-separator]]:hidden [&_[cmdk-group]]:border-t-0 [&_[cmdk-group-heading]]:border-t-0">
                                    <CommandInput
                                        placeholder="Search voices by name, genre, or description..."
                                        className="h-9 bg-white dark:bg-gray-800 border-none outline-none ring-0 focus:ring-0 focus:outline-none focus:border-none shadow-none"
                                    />
                                    <CommandList className="max-h-[200px] bg-white dark:bg-gray-800 border-t-0 [&_[cmdk-list]]:border-t-0">
                                        <CommandEmpty>No voices found.</CommandEmpty>

                                        {/* User Voices Group */}
                                        {userVoices.length > 0 && (
                                            <CommandGroup heading="My Voices" className="border-t-0 [&_[cmdk-group-heading]]:border-t-0">
                                                {userVoices.map((voice) => (
                                                    <CommandItem
                                                        key={voice.id}
                                                        value={`${voice.name} ${voice.description || ''} ${voice.genre?.name || ''} ${voice.gender || ''}`}
                                                        onSelect={() => {
                                                            onVoiceSelect(voice.id);
                                                            setIsOpen(false);
                                                            setIsExpanded(false);
                                                        }}
                                                        className="flex items-center space-x-2"
                                                    >
                                                        <User className="h-4 w-4 text-blue-500" />
                                                        <div className="flex-1">
                                                            <div className="font-medium">{voice.name}</div>
                                                            {voice.description && (
                                                                <div className="text-xs text-gray-500 truncate">
                                                                    {voice.description}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {voice.genre && (
                                                            <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">
                                                                {voice.genre.name}
                                                            </span>
                                                        )}
                                                        <Check
                                                            className={cn(
                                                                "h-4 w-4",
                                                                selectedVoiceId === voice.id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        )}

                                        {/* Saved Voices Group */}
                                        {savedVoices.length > 0 && (
                                            <CommandGroup heading="Saved Voices">
                                                {savedVoices.map((voice) => (
                                                    <CommandItem
                                                        key={voice.id}
                                                        value={`${voice.name} ${voice.description || ''} ${voice.genre?.name || ''} ${voice.gender || ''}`}
                                                        onSelect={() => {
                                                            onVoiceSelect(voice.id);
                                                            setIsOpen(false);
                                                            setIsExpanded(false);
                                                        }}
                                                        className="flex items-center space-x-2"
                                                    >
                                                        <Heart className="h-4 w-4 text-red-500" />
                                                        <div className="flex-1">
                                                            <div className="font-medium">{voice.name}</div>
                                                            {voice.description && (
                                                                <div className="text-xs text-gray-500 truncate">
                                                                    {voice.description}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {voice.genre && (
                                                            <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">
                                                                {voice.genre.name}
                                                            </span>
                                                        )}
                                                        <Check
                                                            className={cn(
                                                                "h-4 w-4",
                                                                selectedVoiceId === voice.id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        )}
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </div>
        </div>
    );
}