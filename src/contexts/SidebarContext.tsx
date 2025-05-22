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
    isOpen: true, // Default to open for desktop view
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
    // Default to open for desktop, closed for mobile
    const [isOpen, setIsOpen] = useState(true);
    const [voices, setVoices] = useState<Voice[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { data: session, status } = useSession();

    // Check for mobile on client side only
    useEffect(() => {
        const checkIfMobile = () => {
            setIsOpen(window.innerWidth > 768);
        };

        // Set initial state
        checkIfMobile();

        // Add event listener for window resize
        window.addEventListener('resize', checkIfMobile);

        // Clean up
        return () => window.removeEventListener('resize', checkIfMobile);
    }, []);

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