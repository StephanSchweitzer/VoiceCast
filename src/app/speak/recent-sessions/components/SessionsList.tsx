import { MessageSquare, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import SessionItem from './SessionItem';
import SessionSkeleton from './SessionSkeleton';
import { SessionSearchResult } from '@/types/speak';

interface SessionsListProps {
    sessions: SessionSearchResult[];
    loading: boolean;
    loadingMore: boolean;
    hasMore: boolean;
    error: string | null;
    onLoadMore: () => void;
    onRetry: () => void;
    searchQuery: string;
}

export default function SessionsList({
                                         sessions,
                                         loading,
                                         loadingMore,
                                         hasMore,
                                         error,
                                         onLoadMore,
                                         onRetry,
                                         searchQuery
                                     }: SessionsListProps) {
    // Loading state
    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                    <SessionSkeleton key={i} />
                ))}
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <Card className="bg-gray-100 dark:bg-gray-800 border-red-200 dark:border-red-800">
                <CardContent className="p-6">
                    <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {error}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onRetry}
                                className="ml-4"
                            >
                                Try again
                            </Button>
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    // Empty state
    if (sessions.length === 0) {
        return (
            <Card className="bg-gray-100 dark:bg-gray-800">
                <CardContent className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        {searchQuery ? 'No sessions found' : 'No sessions yet'}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        {searchQuery
                            ? `No sessions match "${searchQuery}". Try a different search term.`
                            : 'Start creating voice conversations to see them here.'
                        }
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Sessions */}
            {sessions.map((session) => (
                <SessionItem
                    key={session.id}
                    session={session}
                    searchQuery={searchQuery}
                />
            ))}

            {/* Load More */}
            {hasMore && (
                <div className="flex justify-center pt-4">
                    <Button
                        variant="outline"
                        onClick={onLoadMore}
                        disabled={loadingMore}
                        className="min-w-32"
                    >
                        {loadingMore ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Loading...
                            </>
                        ) : (
                            'Load More'
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}