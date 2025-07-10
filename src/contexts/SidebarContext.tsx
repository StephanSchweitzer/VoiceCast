'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Voice } from '@prisma/client';
import { useSession } from 'next-auth/react';

interface SpeakSession {
    id: string;
    name: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    _count: {
        generatedAudios: number;
    };
}

interface SidebarContextType {
    isOpen: boolean;
    toggleSidebar: () => void;
    closeSidebar: () => void;
    openSidebar: () => void;
    voices: Voice[];
    speakSessions: SpeakSession[];
    isLoading: boolean;
    isLoadingSessions: boolean;
    error: string | null;
    sessionError: string | null;
    refreshVoices: () => Promise<void>;
    refreshSpeakSessions: () => Promise<void>;
    // Collapsible sections
    voicesCollapsed: boolean;
    speakSessionsCollapsed: boolean;
    toggleVoicesCollapsed: () => void;
    toggleSpeakSessionsCollapsed: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
    isOpen: false,
    toggleSidebar: () => {},
    closeSidebar: () => {},
    openSidebar: () => {},
    voices: [],
    speakSessions: [],
    isLoading: false,
    isLoadingSessions: false,
    error: null,
    sessionError: null,
    refreshVoices: async () => {},
    refreshSpeakSessions: async () => {},
    voicesCollapsed: false,
    speakSessionsCollapsed: false,
    toggleVoicesCollapsed: () => {},
    toggleSpeakSessionsCollapsed: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const [voices, setVoices] = useState<Voice[]>([]);
    const [speakSessions, setSpeakSessions] = useState<SpeakSession[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingSessions, setIsLoadingSessions] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sessionError, setSessionError] = useState<string | null>(null);
    const { data: session, status } = useSession();

    // Collapsible sections state
    const [voicesCollapsed, setVoicesCollapsed] = useState(false);
    const [speakSessionsCollapsed, setSpeakSessionsCollapsed] = useState(false);

    // Handle client-side mounting and load saved state
    useEffect(() => {
        setIsClient(true);

        // Load saved sidebar state from localStorage
        const savedState = localStorage.getItem('sidebar-open');
        if (savedState !== null) {
            const isOpenSaved = JSON.parse(savedState);
            const isDesktop = window.innerWidth > 768;
            setIsOpen(isDesktop && isOpenSaved);
        } else {
            setIsOpen(false);
        }

        // Load saved collapsible states
        const savedVoicesCollapsed = localStorage.getItem('sidebar-voices-collapsed');
        if (savedVoicesCollapsed !== null) {
            setVoicesCollapsed(JSON.parse(savedVoicesCollapsed));
        }

        const savedSessionsCollapsed = localStorage.getItem('sidebar-sessions-collapsed');
        if (savedSessionsCollapsed !== null) {
            setSpeakSessionsCollapsed(JSON.parse(savedSessionsCollapsed));
        }
    }, []);

    // Save state to localStorage whenever it changes
    useEffect(() => {
        if (isClient) {
            localStorage.setItem('sidebar-open', JSON.stringify(isOpen));
        }
    }, [isOpen, isClient]);

    useEffect(() => {
        if (isClient) {
            localStorage.setItem('sidebar-voices-collapsed', JSON.stringify(voicesCollapsed));
        }
    }, [voicesCollapsed, isClient]);

    useEffect(() => {
        if (isClient) {
            localStorage.setItem('sidebar-sessions-collapsed', JSON.stringify(speakSessionsCollapsed));
        }
    }, [speakSessionsCollapsed, isClient]);

    // Handle window resize
    useEffect(() => {
        if (!isClient) return;

        const handleResize = () => {
            const isDesktop = window.innerWidth > 768;
            if (!isDesktop) {
                setIsOpen(false);
            } else {
                const savedState = localStorage.getItem('sidebar-open');
                if (savedState !== null) {
                    setIsOpen(JSON.parse(savedState));
                }
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isClient]);

    const toggleSidebar = useCallback(() => {
        setIsOpen(!isOpen);
    }, [isOpen]);

    const closeSidebar = useCallback(() => {
        setIsOpen(false);
    }, []);

    const openSidebar = useCallback(() => {
        setIsOpen(true);
    }, []);

    const toggleVoicesCollapsed = useCallback(() => {
        setVoicesCollapsed(!voicesCollapsed);
    }, [voicesCollapsed]);

    const toggleSpeakSessionsCollapsed = useCallback(() => {
        setSpeakSessionsCollapsed(!speakSessionsCollapsed);
    }, [speakSessionsCollapsed]);

    const refreshVoices = useCallback(async () => {
        if (!session) {
            setVoices([]);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/voices?type=user');

            if (!response.ok) {
                throw new Error(`Failed to fetch voices: ${response.status}`);
            }

            const data = await response.json();
            setVoices(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch voices';
            setError(errorMessage);
            console.error('Error fetching voices:', err);
            setVoices([]);
        } finally {
            setIsLoading(false);
        }
    }, [session]);

    const refreshSpeakSessions = useCallback(async () => {
        if (!session) {
            setSpeakSessions([]);
            return;
        }

        setIsLoadingSessions(true);
        setSessionError(null);

        try {
            const response = await fetch('/api/speak-sessions');

            if (!response.ok) {
                throw new Error(`Failed to fetch speak sessions: ${response.status}`);
            }

            const data = await response.json();
            setSpeakSessions(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch speak sessions';
            setSessionError(errorMessage);
            console.error('Error fetching speak sessions:', err);
            setSpeakSessions([]);
        } finally {
            setIsLoadingSessions(false);
        }
    }, [session]);

    // Fetch data when session changes
    useEffect(() => {
        if (status === 'loading') return;

        if (status === 'authenticated') {
            refreshVoices();
            refreshSpeakSessions();
        } else {
            setVoices([]);
            setSpeakSessions([]);
            setError(null);
            setSessionError(null);
            setIsLoading(false);
            setIsLoadingSessions(false);
        }
    }, [status, refreshVoices, refreshSpeakSessions]);

    return (
        <SidebarContext.Provider value={{
            isOpen,
            toggleSidebar,
            closeSidebar,
            openSidebar,
            voices,
            speakSessions,
            isLoading,
            isLoadingSessions,
            error,
            sessionError,
            refreshVoices,
            refreshSpeakSessions,
            voicesCollapsed,
            speakSessionsCollapsed,
            toggleVoicesCollapsed,
            toggleSpeakSessionsCollapsed
        }}>
            {children}
        </SidebarContext.Provider>
    );
}