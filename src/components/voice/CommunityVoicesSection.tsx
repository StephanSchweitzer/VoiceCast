'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Voice {
    id: string;
    name: string;
    description: string;
    isPublic: boolean;
    audioSample: string;
    duration?: number;
    gender: string;
    createdAt: string;
    updatedAt: string;
    userId: string;
    user?: {
        name: string;
        image?: string;
    };
}

export default function CommunityVoicesSection() {
    const [publicVoices, setPublicVoices] = useState<Voice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCommunityVoices = async () => {
            try {
                const response = await fetch('/api/voices?type=public');
                if (!response.ok) {
                    throw new Error('Failed to fetch community voices');
                }
                const voices = await response.json();
                // Limit to 6 voices for the preview section
                setPublicVoices(voices.slice(0, 6));
            } catch (error) {
                console.error('Error fetching community voices:', error);
                setError('Failed to load community voices');
            } finally {
                setLoading(false);
            }
        };

        fetchCommunityVoices();
    }, []);

    if (loading) {
        return (
            <div className="overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 shadow">
                <div className="px-4 py-5 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">Community Voices</h2>
                    <div className="mt-4 animate-pulse">
                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 shadow">
                <div className="px-4 py-5 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">Community Voices</h2>
                    <div className="mt-4 text-center py-8">
                        <p className="text-red-500 dark:text-red-400">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        >
                            Try again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 shadow">
            <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Community Voices</h2>

                {publicVoices.length > 0 ? (
                    <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {publicVoices.map((voice) => (
                            <Link
                                key={voice.id}
                                href={`/voice/${voice.id}`}
                                className="block rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                            >
                                <h3 className="text-md font-medium text-gray-900 dark:text-white">{voice.name}</h3>
                                {voice.description && (
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                        {voice.description}
                                    </p>
                                )}
                                <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                                    <span className="mr-2 rounded-full px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300">
                                        Public
                                    </span>
                                    <span>
                                        By: {voice.user?.name || 'Anonymous'}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="mt-4 text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">
                            No community voices available yet.
                        </p>
                    </div>
                )}

                <div className="mt-4 text-center">
                    <Link
                        href="/voice/community"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                        Browse all community voices →
                    </Link>
                </div>
            </div>
        </div>
    );
}