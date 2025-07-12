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
import { ChevronDown, Check, User, Bookmark } from 'lucide-react';
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
    const userVoiceCount = userVoices.length;
    const savedVoiceCount = savedVoices.length;

    // Handle voice selection and close popover
    const handleVoiceSelect = (voiceId: string) => {
        onVoiceSelect(voiceId);
        setIsOpen(false);
    };

    if (allVoicesEmpty) {
        return (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2 sm:p-3 border border-gray-200 dark:border-gray-700 text-center">
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 sm:mb-3">
                    You don't have any voices yet. Create or save some voices to get started.
                </p>
                <Button asChild variant="outline" size="sm">
                    <a href="/voice">Browse Voices</a>
                </Button>
            </div>
        );
    }

    return (
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <Popover
                open={isOpen}
                onOpenChange={setIsOpen}
                modal={true}
            >
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        role="combobox"
                        aria-expanded={isOpen}
                        className="w-full h-auto p-2 sm:p-3 justify-between bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg border-0 shadow-none cursor-pointer active:bg-gray-200 dark:active:bg-gray-700"
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="flex-1 text-left">
                            {selectedVoice ? (
                                <div className="flex items-center space-x-2">
                                    <div className="flex items-center space-x-1">
                                        {selectedVoice.type === 'user' ? (
                                            <User className="h-3 w-3 text-blue-500" />
                                        ) : (
                                            <Bookmark className="h-3 w-3 text-green-500" />
                                        )}
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {selectedVoice.name}
                                        </span>
                                        {selectedVoice.type === 'saved' && (
                                            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                                Saved
                                            </span>
                                        )}
                                    </div>
                                    {selectedVoice.genre && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                                            {selectedVoice.genre.name}
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    Select a voice...
                                </span>
                            )}
                        </div>
                        <ChevronDown className={cn(
                            "h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200",
                            isOpen && "rotate-180"
                        )} />
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-[--radix-popover-trigger-width] p-0 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg"
                    align="start"
                    side="bottom"
                    sideOffset={4}
                    avoidCollisions={true}
                    sticky="always"
                    onOpenAutoFocus={(e) => {
                        // Prevent auto-focus behavior that can cause viewport jumping on mobile
                        e.preventDefault();
                    }}
                >
                    {/* Header with stats - only shown when open */}
                    <div className="px-2 py-1 sm:px-3 sm:py-2 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900">
                        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Select Voice</span>
                            <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-1">
                                    <User className="h-3 w-3 text-blue-500" />
                                    <span>{userVoiceCount} My Voices</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <Bookmark className="h-3 w-3 text-green-500" />
                                    <span>{savedVoiceCount} Saved</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Command
                        className="bg-white dark:bg-gray-800 [&_[data-slot=command-input-wrapper]]:border-b-0 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-0 [&_[cmdk-separator]]:hidden [&_[cmdk-group]]:border-t-0 [&_[cmdk-group-heading]]:border-t-0"
                        shouldFilter={true}
                    >
                        <CommandInput
                            placeholder="Search voices by name, genre, or description..."
                            className="h-8 sm:h-9 bg-white dark:bg-gray-800 border-none outline-none ring-0 focus:ring-0 focus:outline-none focus:border-none shadow-none"
                            autoFocus={false}
                        />
                        <CommandList className="max-h-[200px] bg-white dark:bg-gray-800 border-t-0 [&_[cmdk-list]]:border-t-0 overscroll-contain">
                            <CommandEmpty>No voices found.</CommandEmpty>

                            {/* User Voices Group */}
                            {userVoices.length > 0 && (
                                <CommandGroup heading="My Voices" className="border-t-0 [&_[cmdk-group-heading]]:border-t-0">
                                    {userVoices.map((voice) => (
                                        <CommandItem
                                            key={voice.id}
                                            value={`${voice.name} ${voice.description || ''} ${voice.genre?.name || ''} ${voice.gender || ''}`}
                                            onSelect={() => handleVoiceSelect(voice.id)}
                                            className="flex items-center space-x-2 cursor-pointer"
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
                                            onSelect={() => handleVoiceSelect(voice.id)}
                                            className="flex items-center space-x-2 cursor-pointer"
                                        >
                                            <Bookmark className="h-4 w-4 text-green-500" />
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
    );
}