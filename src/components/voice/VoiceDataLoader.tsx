'use client';

import { useSidebar } from '@/contexts/SidebarContext';
import { useEffect } from 'react';
import { Voice } from '@/types/voice';

export function VoiceDataLoader({ voices }: { voices: Voice[] }) {
    const { setVoices } = useSidebar();

    useEffect(() => {
        setVoices(voices);
    }, [voices, setVoices]);

    return null;
}