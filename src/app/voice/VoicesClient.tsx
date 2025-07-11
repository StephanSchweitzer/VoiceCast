'use client';

import { useState, useEffect, useCallback } from 'react';
import VoicesSearch from './components/VoicesSearch';
import VoicesList from './components/VoicesList';

// Type based on your existing API response
interface VoiceLibraryItem {
    id: string;
    name: string;
    description: string | null;
    audioSample: string;
    duration: number | null;
    isPublic: boolean;
    gender: string | null;
    createdAt: string; // API returns as string
    updatedAt: string;
    userId: string;
    genre?: {
        id: string;
        name: string;
    } | null;
    user?: {
        name: string | null;
        image: string | null;
    } | null;
    isSaved: boolean;
}

interface VoicesClientProps {
    userId: string;
}

export default function VoicesClient({ userId }: VoicesClientProps) {
    const [voices, setVoices] = useState<VoiceLibraryItem[]>([]);
    const [filteredVoices, setFilteredVoices] = useState<VoiceLibraryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'uploaded' | 'saved'>('all');
    const [error, setError] = useState<string | null>(null);

    // Debounced search
    const [debouncedQuery, setDebouncedQuery] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Load voices using your existing API
    const loadVoices = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Use your existing API with type 'all' to get user's own + public voices
            // Then we'll filter client-side for uploaded vs saved
            const response = await fetch('/api/voices?type=all');

            if (!response.ok) {
                throw new Error('Failed to load voices');
            }

            const data = await response.json();

            // Filter to only show voices the user owns or has saved
            const userVoices = data.filter((voice: VoiceLibraryItem) =>
                voice.userId === userId || voice.isSaved
            );

            setVoices(userVoices);
        } catch (err) {
            console.error('Error loading voices:', err);
            setError('Failed to load voices. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // Load initial voices
    useEffect(() => {
        loadVoices();
    }, [loadVoices]);

    // Filter and search voices
    useEffect(() => {
        let filtered = voices;

        // Apply filter
        if (activeFilter === 'uploaded') {
            filtered = voices.filter(voice => voice.userId === userId);
        } else if (activeFilter === 'saved') {
            filtered = voices.filter(voice => voice.userId !== userId && voice.isSaved);
        }

        // Apply search
        if (debouncedQuery.trim()) {
            const query = debouncedQuery.toLowerCase();
            filtered = filtered.filter(voice =>
                voice.name.toLowerCase().includes(query) ||
                voice.description?.toLowerCase().includes(query) ||
                voice.user?.name?.toLowerCase().includes(query) ||
                voice.genre?.name.toLowerCase().includes(query)
            );
        }

        setFilteredVoices(filtered);
    }, [voices, activeFilter, debouncedQuery, userId]);

    // Handle search
    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    // Handle filter change
    const handleFilterChange = (filter: 'all' | 'uploaded' | 'saved') => {
        setActiveFilter(filter);
    };

    // Handle retry
    const handleRetry = () => {
        loadVoices();
    };

    // Get counts for tabs
    const uploadedCount = voices.filter(voice => voice.userId === userId).length;
    const savedCount = voices.filter(voice => voice.userId !== userId && voice.isSaved).length;

    return (
        <div className="space-y-6">
            {/* Filter Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8">
                    {[
                        { key: 'all', label: `All Voices (${voices.length})` },
                        { key: 'uploaded', label: `My Uploads (${uploadedCount})` },
                        { key: 'saved', label: `Saved Voices (${savedCount})` }
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => handleFilterChange(tab.key as any)}
                            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                                activeFilter === tab.key
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Search */}
            <VoicesSearch
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search voices by name, description, creator, or genre..."
            />

            {/* Voices List */}
            <VoicesList
                voices={filteredVoices}
                loading={loading}
                error={error}
                onRetry={handleRetry}
                searchQuery={debouncedQuery}
                currentUserId={userId}
            />
        </div>
    );
}