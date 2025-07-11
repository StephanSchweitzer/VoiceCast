'use client';

import Link from 'next/link';
import {Bookmark} from "lucide-react";

// Database query result type (dates are Date objects from Prisma)
export interface VoiceCardData {
    id: string;
    name: string;
    description: string | null;
    audioSample: string;
    duration: number | null;
    isPublic: boolean;
    gender: string | null;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    genre?: {
        id: string;
        name: string;
    } | null;
}
interface VoiceCardProps {
    voice: VoiceCardData;
    isOwner?: boolean;
    user?: {
        name?: string | null;
        image?: string | null;
    } | null;
    variant?: 'grid' | 'list';
    isSaved?: boolean;
    onToggleSave?: () => void; // Add this line
}

// Helper function to format date consistently
function formatDate(date: Date | string): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${month}/${day}/${year}`;
}

// Helper function to format duration
const formatDuration = (duration: number | null | undefined) => {
    if (!duration || duration <= 0) return null;
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Helper function to get gender display color
const getGenderColor = (gender: string | null) => {
    if (!gender) return 'bg-slate-200 dark:bg-gray-900 text-slate-800 dark:text-gray-300';
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
const getGenreColor = (genre: { id: string; name: string }) => {
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

export default function VoiceCard({ voice, isOwner = false, user, variant = 'grid', isSaved = false }: VoiceCardProps) {
    // Defensive check to ensure voice is defined
    if (!voice) {
        return (
            <div className="block rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 p-4">
                <div className="text-center text-gray-500 dark:text-gray-400">
                    Voice data unavailable
                </div>
            </div>
        );
    }

    const formattedDuration = formatDuration(voice.duration);

    if (variant === 'list') {
        return (
            <Link
                href={`/voice/${voice.id}`}
                className="block rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all hover:shadow-md"
            >
                <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12 bg-slate-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        {user?.image ? (
                            <img
                                src={user.image}
                                alt={user?.name || "User"}
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
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{voice.name}</h3>
                                    <div className="flex items-center gap-1">
                                        {formattedDuration && (
                                            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-slate-200 dark:bg-gray-800 px-2 py-1 rounded">
                                                {formattedDuration}
                                            </span>
                                        )}
                                        {isSaved && (
                                            <div className="flex items-center">
                                                <svg className="h-4 w-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v13a1 1 0 01-1.6.8L10 14.5l-5.4 3.3A1 1 0 013 17V4z" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {user && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        By: {user?.name || 'Anonymous'}
                                    </p>
                                )}
                                {voice.description && (
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        {voice.description}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center flex-wrap gap-1 ml-4">
                                <span className={`rounded-full px-2 py-0.5 text-xs ${
                                    voice.isPublic
                                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
                                        : 'bg-slate-200 dark:bg-gray-700 text-slate-800 dark:text-gray-300'
                                }`}>
                                    {voice.isPublic ? 'Public' : 'Private'}
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
                    </div>
                </div>
            </Link>
        );
    }

    // Grid variant (default)
    return (
        <Link
            href={`/voice/${voice.id}`}
            className="block rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all hover:shadow-md"
        >
            <div className="flex flex-col h-full">
                {/* Header with title and key info */}
                <div className="flex-grow">
                    <div className="flex items-start justify-between mb-2">
                        <h3 className="text-md font-medium text-gray-900 dark:text-white pr-2 line-clamp-1">
                            {voice.name}
                        </h3>
                        <div className="flex items-center gap-1 flex-shrink-0">
                            {formattedDuration && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-slate-200 dark:bg-gray-800 px-2 py-1 rounded">
                                    {formattedDuration}
                                </span>
                            )}
                            {isSaved && (
                                <div className="flex items-center">
                                    <Bookmark className="h-4 w-4 text-green-500" />
                                </div>
                            )}
                        </div>
                    </div>

                    {user && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            By: {user?.name || 'Anonymous'}
                        </p>
                    )}

                    {voice.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                            {voice.description}
                        </p>
                    )}
                </div>

                {/* Badge section */}
                <div className="space-y-2">
                    {/* Top row - Genre and Gender badges */}
                    <div className="flex items-center flex-wrap gap-1">
                        {voice.genre && (
                            <span className={`text-xs rounded-full px-2 py-0.5 ${getGenreColor(voice.genre)}`}>
                                {voice.genre.name}
                            </span>
                        )}
                        {voice.gender && (
                            <span className={`text-xs rounded-full px-2 py-0.5 ${getGenderColor(voice.gender)}`}>
                                {voice.gender.charAt(0).toUpperCase() + voice.gender.slice(1)}
                            </span>
                        )}
                    </div>

                    {/* Bottom row - Status and date */}
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span className={`rounded-full px-2 py-0.5 ${
                            voice.isPublic
                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
                                : 'bg-slate-200 dark:bg-gray-700 text-slate-800 dark:text-gray-300'
                        }`}>
                            {voice.isPublic ? 'Public' : 'Private'}
                        </span>
                        <span>
                            {formatDate(voice.createdAt)}
                        </span>
                    </div>
                </div>

                {/* Subtle hover indicator */}
                <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center text-xs text-gray-400 dark:text-gray-500">
                        <svg
                            className="mr-1 h-3 w-3"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M8 5v14l11-7z"
                                fill="currentColor"
                            />
                        </svg>
                        <span>Click to view & play</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}