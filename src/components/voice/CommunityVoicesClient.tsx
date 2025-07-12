'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { VoiceWithOptionalUser } from '@/types/voice';
import { Genre } from '@/types/genres';
import VoiceCard, { VoiceCardData } from './VoiceCard';

type ViewType = 'list' | 'grid';
type GenderFilter = 'all' | 'male' | 'female' | 'other';
type GenreFilter = 'all' | string;

interface CommunityVoicesClientProps {
    initialVoices: VoiceWithOptionalUser[]; // Use server-rendered initial data
}

export default function CommunityVoicesClient({ initialVoices }: CommunityVoicesClientProps) {
    const { data: session } = useSession();

    // 🔑 Start with server-rendered data (instant load, SEO-friendly)
    const [voices, setVoices] = useState(initialVoices);
    const [searchQuery, setSearchQuery] = useState('');
    const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');
    const [genreFilter, setGenreFilter] = useState<GenreFilter>('all');
    const [viewType, setViewType] = useState<ViewType>('grid');
    const [filteredVoices, setFilteredVoices] = useState(initialVoices);
    const [availableGenres, setAvailableGenres] = useState<Genre[]>([]);

    // Extract unique genders from the voices for filter options
    const availableGenders = Array.from(new Set(
        voices
            .map(voice => voice.gender?.toLowerCase())
            .filter(Boolean)
    )) as string[];

    // 🔄 OPTIONAL: Refresh data when session changes (for real-time saved status updates)
    useEffect(() => {
        const refreshVoicesData = async () => {
            if (!session) return;

            try {
                const response = await fetch('/api/voices?type=public');
                if (response.ok) {
                    const freshVoices = await response.json();
                    setVoices(freshVoices);
                }
            } catch (error) {
                console.error('Error refreshing voices:', error);
                // Fall back to initial data on error
            }
        };

        // Only refresh if we have a session and initial data is from server
        if (session && initialVoices.length > 0) {
            refreshVoicesData();
        }
    }, [session]); // Re-fetch when session changes

    // Function to handle saving/unsaving voices with optimistic updates
    const handleToggleSave = async (voiceId: string, currentSavedStatus: boolean) => {
        if (!session) return;

        // Optimistic update - update UI immediately
        setVoices(prevVoices =>
            prevVoices.map(voice =>
                voice.id === voiceId
                    ? { ...voice, isSaved: !currentSavedStatus }
                    : voice
            )
        );

        try {
            const endpoint = currentSavedStatus ? '/api/voices/unsave' : '/api/voices/save';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ voiceId })
            });

            if (!response.ok) {
                // Revert optimistic update on error
                setVoices(prevVoices =>
                    prevVoices.map(voice =>
                        voice.id === voiceId
                            ? { ...voice, isSaved: currentSavedStatus }
                            : voice
                    )
                );
            }
        } catch (error) {
            console.error('Error toggling save status:', error);
            // Revert optimistic update on error
            setVoices(prevVoices =>
                prevVoices.map(voice =>
                    voice.id === voiceId
                        ? { ...voice, isSaved: currentSavedStatus }
                        : voice
                )
            );
        }
    };

    // Fetch genres from API
    useEffect(() => {
        const fetchGenres = async () => {
            try {
                const response = await fetch('/api/genres');
                if (response.ok) {
                    const genres = await response.json();
                    setAvailableGenres(genres);
                }
            } catch (error) {
                console.error('Error fetching genres:', error);
            }
        };

        fetchGenres();
    }, []);

    // Apply filters when any filter changes
    useEffect(() => {
        let results = voices;

        // Apply search filter
        if (searchQuery) {
            results = results.filter(voice =>
                voice.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (voice.description && voice.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (voice.genre?.name && voice.genre.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (voice.gender && voice.gender.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        // Apply gender filter
        if (genderFilter !== 'all') {
            results = results.filter(voice =>
                voice.gender?.toLowerCase() === genderFilter.toLowerCase()
            );
        }

        // Apply genre filter
        if (genreFilter !== 'all') {
            results = results.filter(voice => voice.genre?.id === genreFilter);
        }

        setFilteredVoices(results);
    }, [searchQuery, genderFilter, genreFilter, voices]);

    // Convert VoiceWithOptionalUser to VoiceCardData format
    const convertToVoiceCardData = (voice: VoiceWithOptionalUser): VoiceCardData => {
        return {
            id: voice?.id || '',
            name: voice?.name || 'Untitled Voice',
            description: voice?.description || null,
            audioSample: voice?.audioSample || '',
            duration: voice?.duration || null,
            isPublic: voice?.isPublic ?? true,
            gender: voice?.gender || null,
            createdAt: voice?.createdAt ? new Date(voice.createdAt) : new Date(),
            updatedAt: voice?.updatedAt ? new Date(voice.updatedAt) : new Date(),
            userId: voice?.userId || '',
            genre: voice?.genre || null
        };
    };

    // Check if voice is saved
    const isVoiceSaved = (voice: VoiceWithOptionalUser): boolean => {
        return voice.isSaved === true;
    };

    return (
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Community Voices
                </h1>

                {/* Search and Filter Section */}
                <div className="overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 shadow p-4 mb-6">
                    {/* Search Bar */}
                    <div className="mb-4">
                        <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Search Voices
                        </label>
                        <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                name="search"
                                id="search"
                                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-md"
                                placeholder="Search voices..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Gender Filter */}
                        <div>
                            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Voice Gender
                            </label>
                            <select
                                id="gender"
                                name="gender"
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                value={genderFilter}
                                onChange={(e) => setGenderFilter(e.target.value as GenderFilter)}
                            >
                                <option value="all">All Genders</option>
                                {availableGenders.map((gender) => (
                                    <option key={gender} value={gender}>
                                        {gender.charAt(0).toUpperCase() + gender.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Genre Filter */}
                        <div>
                            <label htmlFor="genre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Voice Genre
                            </label>
                            <select
                                id="genre"
                                name="genre"
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                value={genreFilter}
                                onChange={(e) => setGenreFilter(e.target.value)}
                            >
                                <option value="all">All Genres</option>
                                {availableGenres.map((genre) => (
                                    <option key={genre.id} value={genre.id}>
                                        {genre.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* View Type Switcher */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                View Type
                            </label>
                            <div className="mt-1 flex rounded-md shadow-sm">
                                <button
                                    type="button"
                                    className={`relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 text-sm font-medium ${
                                        viewType === 'list'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600'
                                    }`}
                                    onClick={() => setViewType('list')}
                                >
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <span className="ml-2">List</span>
                                </button>
                                <button
                                    type="button"
                                    className={`relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 text-sm font-medium ${
                                        viewType === 'grid'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600'
                                    }`}
                                    onClick={() => setViewType('grid')}
                                >
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 8a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zm8-8a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2h-2zm0 8a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2z" />
                                    </svg>
                                    <span className="ml-2">Grid</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results Count */}
                <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                    Showing {filteredVoices.length} {filteredVoices.length === 1 ? 'voice' : 'voices'}
                    {session && ` (${filteredVoices.filter(v => v.isSaved).length} saved)`}
                </div>

                {/* Voices Display */}
                {filteredVoices.length > 0 ? (
                    viewType === 'grid' ? (
                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredVoices.map((voice) => (
                                <VoiceCard
                                    key={voice.id}
                                    voice={convertToVoiceCardData(voice)}
                                    user={voice.user}
                                    variant="grid"
                                    isSaved={isVoiceSaved(voice)}
                                    onToggleSave={() => handleToggleSave(voice.id, voice.isSaved || false)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredVoices.map((voice) => (
                                <VoiceCard
                                    key={voice.id}
                                    voice={convertToVoiceCardData(voice)}
                                    user={voice.user}
                                    variant="list"
                                    isSaved={isVoiceSaved(voice)}
                                    onToggleSave={() => handleToggleSave(voice.id, voice.isSaved || false)}
                                />
                            ))}
                        </div>
                    )
                ) : (
                    <div className="text-center py-12 bg-gray-100 dark:bg-gray-800 rounded-lg shadow">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No voices found</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Try adjusting your search or filter criteria.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}