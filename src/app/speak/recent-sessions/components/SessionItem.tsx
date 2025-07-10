import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Clock, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SessionSearchResult } from '@/types/speak';
import Link from 'next/link';

interface SessionItemProps {
    session: SessionSearchResult;
    searchQuery: string;
}

export default function SessionItem({ session, searchQuery }: SessionItemProps) {
    // Highlight search terms in text
    const highlightText = (text: string, query: string) => {
        if (!query.trim()) return text;

        const regex = new RegExp(`(${query.trim()})`, 'gi');
        const parts = text.split(regex);

        return parts.map((part, index) =>
            regex.test(part) ? (
                <mark key={index} className="bg-yellow-200 dark:bg-yellow-900 px-1 rounded">
                    {part}
                </mark>
            ) : part
        );
    };

    const formatDate = (date: string) => {
        try {
            return formatDistanceToNow(new Date(date), { addSuffix: true });
        } catch {
            return 'Unknown';
        }
    };

    return (
        <Link href={`/speak/session/${session.id}`} className="block">
            <Card className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 hover:shadow-md transition-all cursor-pointer">
                <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                            {/* Session Name */}
                            <h3 className="font-medium text-gray-900 dark:text-white truncate">
                                {highlightText(session.name, searchQuery)}
                            </h3>

                            {/* Latest Audio Preview */}
                            {session.latestAudio && (
                                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                    <p className="line-clamp-2">
                                        {highlightText(session.latestAudio.text, searchQuery)}
                                    </p>

                                    {/* Voice and Emotion */}
                                    <div className="flex items-center gap-2 mt-1">
                                        <User className="h-3 w-3" />
                                        <span className="text-xs">
                                            {session.latestAudio.voice.name}
                                        </span>
                                        <Badge variant="secondary" className="text-xs bg-slate-200 dark:bg-gray-600 text-slate-700 dark:text-gray-300">
                                            {session.latestAudio.emotion}
                                        </Badge>
                                    </div>
                                </div>
                            )}

                            {/* Metadata */}
                            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                                <div className="flex items-center gap-1">
                                    <MessageSquare className="h-3 w-3" />
                                    <span>{session.audioCount} audio{session.audioCount !== 1 ? 's' : ''}</span>
                                </div>

                                <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>Updated {formatDate(session.updatedAt)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}