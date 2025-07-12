'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import SessionsSearch from './components/SessionsSearch';
import SessionsList from './components/SessionsList';
import { SessionSearchResult } from '@/types/speak';

interface RecentSessionsClientProps {
    userId: string;
}

export default function RecentSessionsClient({ userId }: RecentSessionsClientProps) {
    const [sessions, setSessions] = useState<SessionSearchResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [hasMore, setHasMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Debounced search
    const [debouncedQuery, setDebouncedQuery] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Load sessions
    const loadSessions = useCallback(async (query: string = '', cursor: string | null = null, append: boolean = false) => {
        try {
            if (!append) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }
            setError(null);

            const params = new URLSearchParams();
            if (query.trim()) {
                params.append('q', query.trim());
            }
            params.append('limit', append ? '100' : '30');
            if (cursor) {
                params.append('cursor', cursor);
            }

            const response = await fetch(`/api/speak-sessions/search?${params}`);

            if (!response.ok) {
                throw new Error('Failed to load sessions');
            }

            const data = await response.json();

            if (append) {
                setSessions(prev => [...prev, ...data.sessions]);
            } else {
                setSessions(data.sessions);
            }

            setHasMore(data.hasMore);
            setNextCursor(data.nextCursor);
        } catch (err) {
            console.error('Error loading session:', err);
            setError('Failed to load session. Please try again.');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    // Load initial sessions
    useEffect(() => {
        loadSessions(debouncedQuery);
    }, [debouncedQuery, loadSessions]);

    // Handle load more
    const handleLoadMore = () => {
        if (!loadingMore && hasMore && nextCursor) {
            loadSessions(debouncedQuery, nextCursor, true);
        }
    };

    // Handle search
    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    // Handle retry
    const handleRetry = () => {
        loadSessions(debouncedQuery);
    };

    return (
        <div className="overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 shadow">
            <div className="px-4 py-5 sm:p-6 space-y-6">
                {/* Search */}
                <SessionsSearch
                    value={searchQuery}
                    onChange={handleSearch}
                    placeholder="Search sessions..."
                />

                {/* Sessions List */}
                <SessionsList
                    sessions={sessions}
                    loading={loading}
                    loadingMore={loadingMore}
                    hasMore={hasMore}
                    error={error}
                    onLoadMore={handleLoadMore}
                    onRetry={handleRetry}
                    searchQuery={debouncedQuery}
                />
            </div>
        </div>
    );
}