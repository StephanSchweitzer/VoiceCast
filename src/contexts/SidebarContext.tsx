'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Voice } from '@prisma/client';
import { useSession } from 'next-auth/react';

interface SidebarContextType {
    isOpen: boolean;
    toggleSidebar: () => void;
    closeSidebar: () => void;
    voices: Voice[];
    refreshVoices: () => Promise<void>;
}

const SidebarContext = createContext<SidebarContextType>({
    isOpen: true, // Default to open for desktop view
    toggleSidebar: () => {},
    closeSidebar: () => {},
    voices: [],
    refreshVoices: async () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    // Default to open for desktop, closed for mobile
    const [isOpen, setIsOpen] = useState(true);
    const [voices, setVoices] = useState<Voice[]>([]);
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

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    const closeSidebar = () => {
        setIsOpen(false);
    };

    const refreshVoices = async () => {
        if (session) {
            try {
                const response = await fetch('/api/voices?type=user');
                if (response.ok) {
                    const data = await response.json();
                    setVoices(data);
                }
            } catch (error) {
                console.error('Error fetching voices:', error);
            }
        }
    };

    // Fetch voices when session changes
    useEffect(() => {
        if (status === 'authenticated') {
            refreshVoices();
        } else {
            setVoices([]);
        }
    }, [status]);

    return (
        <SidebarContext.Provider value={{ isOpen, toggleSidebar, closeSidebar, voices, refreshVoices }}>
            {children}
        </SidebarContext.Provider>
    );
}