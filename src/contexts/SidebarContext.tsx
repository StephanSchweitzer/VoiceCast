'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { Voice } from '@/types/voice';

type SidebarContextType = {
    isOpen: boolean;
    toggleSidebar: () => void;
    voices: Voice[];
    setVoices: (voices: Voice[]) => void;
};

const SidebarContext = createContext<SidebarContextType>({
    isOpen: true,
    toggleSidebar: () => {},
    voices: [],
    setVoices: () => {},
});

export function SidebarProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(true);
    const [voices, setVoices] = useState<Voice[]>([]);

    const toggleSidebar = () => setIsOpen(prev => !prev);

    return (
        <SidebarContext.Provider value={{ isOpen, toggleSidebar, voices, setVoices }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    return useContext(SidebarContext);
}