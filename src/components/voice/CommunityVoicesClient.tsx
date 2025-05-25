'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { VoiceWithOptionalUser } from '@/types/voice';
import { Genre } from '@/types/genres';

// Define component-specific types only
type ViewType = 'list' | 'grid';
type GenderFilter = 'all' | 'male' | 'female' | 'other';
type GenreFilter = 'all' | string; // Allow any genre ID

interface CommunityVoicesClientProps {
    initialVoices: VoiceWithOptionalUser[];
}

export default function CommunityVoicesClient({ initialVoices }: CommunityVoicesClientProps) {
    // State for search and filters
    const [searchQuery, setSearchQuery] = useState('');
    const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');
    const [genreFilter, setGenreFilter] = useState<GenreFilter>('all');
    const [viewType, setViewType] = useState<ViewType>('grid');
    const [filteredVoices, setFilteredVoices] = useState(initialVoices);

    // Extract unique genders and genres from the voices for filter options
    const availableGenders = Array.from(new Set(
        initialVoices
            .map(voice => voice.gender?.toLowerCase())
            .filter(Boolean)
    )) as string[];

    const availableGenres = Array.from(new Set(
        initialVoices
            .map(voice => voice.genre)
            .filter(Boolean)
    )) as NonNullable<VoiceWithOptionalUser['genre']>[];

    // Apply filters when any filter changes
    useEffect(() => {
        let results = initialVoices;

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
    }, [searchQuery, genderFilter, genreFilter, initialVoices]);

    // Helper function to format duration
    const formatDuration = (duration: number | null) => {
        if (!duration) return '';
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Helper function to get gender display color
    const getGenderColor = (gender: string | null) => {
        if (!gender) return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-300';
        switch (gender.toLowerCase()) {
            case 'male':
                return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300';
            case 'female':
                return 'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-300';
            default:
                return 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300';
        }
    };

    // Helper function to get genre display color
    const getGenreColor = (genre: NonNullable<VoiceWithOptionalUser['genre']>) => {
        if (!genre) return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-300';
        // Generate consistent color based on genre name
        const colors = [
            'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300',
            'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-300',
            'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300',
            'bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-300',
            'bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-300',
        ];
        const index = genre.name.length % colors.length;
        return colors[index];
    };

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Community Voices
                </h1>

                {/* Search and Filter Section */}
                <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow p-4 mb-6">
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
                                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                                placeholder="Search by name, description, genre, or gender"
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
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
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
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
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
                </div>

                {/* Voices Display */}
                {filteredVoices.length > 0 ? (
                    viewType === 'grid' ? (
                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredVoices.map((voice) => (
                                <Link
                                    key={voice.id}
                                    href={`/voice/${voice.id}`}
                                    className="block rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                                >
                                    <div className="flex items-center mb-2">
                                        <div className="flex-shrink-0 h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            {voice.user?.image ? (
                                                <img
                                                    src={voice.user.image}
                                                    alt={voice.user.name || "User"}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                                                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <div className="ml-3 flex-1">
                                            <h3 className="text-md font-medium text-gray-900 dark:text-white">{voice.name}</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                By: {voice.user?.name || 'Anonymous'}
                                            </p>
                                            {voice.duration && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Duration: {formatDuration(voice.duration)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {voice.description && (
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                            {voice.description}
                                        </p>
                                    )}
                                    <div className="mt-2 flex items-center flex-wrap gap-1 text-xs">
                                        <span className="rounded-full px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300">
                                            Public
                                        </span>
                                        {voice.gender && (
                                            <span className={`rounded-full px-2 py-0.5 ${getGenderColor(voice.gender)}`}>
                                                {voice.gender.charAt(0).toUpperCase() + voice.gender.slice(1)}
                                            </span>
                                        )}
                                        {voice.genre && (
                                            <span className={`rounded-full px-2 py-0.5 ${getGenreColor(voice.genre)}`}>
                                                {voice.genre.name}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredVoices.map((voice) => (
                                <Link
                                    key={voice.id}
                                    href={`/voice/${voice.id}`}
                                    className="block rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                                >
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            {voice.user?.image ? (
                                                <img
                                                    src={voice.user.image}
                                                    alt={voice.user.name || "User"}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                                                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <div className="ml-4 flex-1">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{voice.name}</h3>
                                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                        By: {voice.user?.name || 'Anonymous'}
                                                        {voice.duration && ` • Duration: ${formatDuration(voice.duration)}`}
                                                    </p>
                                                </div>
                                                <div className="flex items-center flex-wrap gap-1">
                                                    <span className="rounded-full px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 text-xs">
                                                        Public
                                                    </span>
                                                    {voice.gender && (
                                                        <span className={`rounded-full px-2 py-0.5 text-xs ${getGenderColor(voice.gender)}`}>
                                                            {voice.gender.charAt(0).toUpperCase() + voice.gender.slice(1)}
                                                        </span>
                                                    )}
                                                    {voice.genre && (
                                                        <span className={`rounded-full px-2 py-0.5 text-xs ${getGenreColor(voice.genre)}`}>
                                                            {voice.genre.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {voice.description && (
                                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                    {voice.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )
                ) : (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
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