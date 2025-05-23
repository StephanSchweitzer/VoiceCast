'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Voice } from '@prisma/client';
import { useSession } from 'next-auth/react';

interface SidebarContextType {
    isOpen: boolean;
    toggleSidebar: () => void;
    closeSidebar: () => void;
    openSidebar: () => void;
    voices: Voice[];
    isLoading: boolean;
    error: string | null;
    refreshVoices: () => Promise<void>;
}

const SidebarContext = createContext<SidebarContextType>({
    isOpen: false, // Default to closed
    toggleSidebar: () => {},
    closeSidebar: () => {},
    openSidebar: () => {},
    voices: [],
    isLoading: false,
    error: null,
    refreshVoices: async () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    // Start with closed by default
    const [isOpen, setIsOpen] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const [voices, setVoices] = useState<Voice[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { data: session, status } = useSession();

    // Handle client-side mounting and load saved state
    useEffect(() => {
        setIsClient(true);

        // Load saved sidebar state from localStorage
        const savedState = localStorage.getItem('sidebar-open');
        if (savedState !== null) {
            const isOpenSaved = JSON.parse(savedState);
            // Only apply saved state if we're on desktop
            const isDesktop = window.innerWidth > 768;
            setIsOpen(isDesktop && isOpenSaved);
        } else {
            // Default behavior: closed on mobile, closed on desktop (changed from open)
            setIsOpen(false);
        }
    }, []);

    // Save state to localStorage whenever it changes (only on client)
    useEffect(() => {
        if (isClient) {
            localStorage.setItem('sidebar-open', JSON.stringify(isOpen));
        }
    }, [isOpen, isClient]);

    // Handle window resize
    useEffect(() => {
        if (!isClient) return;

        const handleResize = () => {
            const isDesktop = window.innerWidth > 768;
            if (!isDesktop) {
                // Always close on mobile
                setIsOpen(false);
            } else {
                // On desktop, restore saved state
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

    const refreshVoices = useCallback(async () => {
        if (!session) {
            setVoices([]);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Fetch user's voices - using the correct endpoint now
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
            setVoices([]); // Clear voices on error
        } finally {
            setIsLoading(false);
        }
    }, [session]);

    // Fetch voices when session changes
    useEffect(() => {
        if (status === 'loading') return; // Wait for session to load

        if (status === 'authenticated') {
            refreshVoices();
        } else {
            // Clear voices when not authenticated
            setVoices([]);
            setError(null);
            setIsLoading(false);
        }
    }, [status, refreshVoices]);

    return (
        <SidebarContext.Provider value={{
            isOpen,
            toggleSidebar,
            closeSidebar,
            openSidebar,
            voices,
            isLoading,
            error,
            refreshVoices
        }}>
            {children}
        </SidebarContext.Provider>
    );
}