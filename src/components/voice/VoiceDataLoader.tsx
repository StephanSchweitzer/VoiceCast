'use client';

import { useEffect } from 'react';
import { Voice } from '@prisma/client';
import { useSidebar } from '@/contexts/SidebarContext';

interface VoiceDataLoaderProps {
    voices: Voice[];
}

export function VoiceDataLoader({ voices }: VoiceDataLoaderProps) {
    // Get the refreshVoices function from the SidebarContext
    const { refreshVoices } = useSidebar();

    useEffect(() => {
        // Instead of using setVoices directly, we'll use the refreshVoices function
        // This will update the voices state in the SidebarContext
        const updateSidebarVoices = async () => {
            await refreshVoices();
        };

        updateSidebarVoices();
    }, [refreshVoices]);

    // This component doesn't render anything
    return null;
}