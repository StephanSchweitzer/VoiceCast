'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Voice } from '@prisma/client';

interface VoiceCardProps {
    voice: Voice;
    isOwner?: boolean;
}

// Helper function to format date consistently
function formatDate(date: Date | string): string {
    const d = new Date(date);
    // Use toISOString and format manually to avoid locale issues
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${month}/${day}/${year}`;
}

export default function VoiceCard({ voice, isOwner = false }: VoiceCardProps) {
    const router = useRouter();

    function handlePlayClick(e: React.MouseEvent) {
        e.preventDefault();
        router.push(`/voice/${voice.id}`);
    }

    return (
        <Link
            href={`/voice/${voice.id}`}
            className="block rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
        >
            <div className="flex flex-col h-full">
                <div className="flex-grow">
                    <h3 className="text-md font-medium text-gray-900 dark:text-white">{voice.name}</h3>
                    {voice.description && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                            {voice.description}
                        </p>
                    )}
                </div>

                <div className="mt-4">
                    <Button
                        size="sm"
                        onClick={handlePlayClick}
                        className="w-full"
                    >
                        <svg
                            className="mr-2 h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M8 5v14l11-7z"
                                fill="currentColor"
                            />
                        </svg>
                        Play Sample
                    </Button>
                </div>

                <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <span className={`mr-2 rounded-full px-2 py-0.5 ${voice.isPublic ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'}`}>
                        {voice.isPublic ? 'Public' : 'Private'}
                    </span>
                    <span>
                        Created: {formatDate(voice.createdAt)}
                    </span>
                </div>
            </div>
        </Link>
    );
}