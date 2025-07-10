import { VoiceWithOptionalUser } from '@/types/voice';

export type SpeakVoice = VoiceWithOptionalUser & {
    savedAt?: string;
};

export interface SpeakSession {
    id: string;
    name: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    _count?: {
        generatedAudios: number;
    };
}

export interface GeneratedAudio {
    id: string;
    text: string;
    emotion: string;
    filePath: string;
    isLiked?: boolean;
    createdAt: string;
    voice: {
        id: string;
        name: string;
        audioSample: string;
    };
    sessionId?: string;
    session?: {
        id: string;
        name: string;
    };
}

export interface Emotion {
    name: string;
    icon: any;
    label: string;
    color: string;
}

// Add this to your existing @/types/speak.ts file

export interface SessionSearchResult {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    audioCount: number;
    latestAudio: {
        id: string;
        text: string;
        createdAt: string;
        emotion: string;
        voice: {
            id: string;
            name: string;
        };
    } | null;
}