import { VoiceWithOptionalUser } from '@/types/voice';

export type SpeakVoice = VoiceWithOptionalUser & {
    savedAt?: string;
};

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
}

export interface Emotion {
    name: string;
    icon: any;
    label: string;
    color: string;
}