export interface Genre {
    id: string;
    name: string;
    createdAt: string; // Timestamp string from API
}

export interface Voice {
    id: string;
    name: string;
    description?: string | null;
    audioSample: string;
    isPublic: boolean;
    gender?: string | null;
    duration?: number | null;
    createdAt: string;
    updatedAt: string;
    userId: string;
    genreId?: string | null;
}

export interface VoiceWithUser extends Voice {
    user: {
        id: string;
        name: string | null;
        image?: string | null;
    };
    genre?: {
        id: string;
        name: string;
    } | null;
}

export interface VoiceWithGenre extends Voice {
    genre?: Genre | null;
}

export interface VoiceWithUserAndGenre extends Voice {
    user: {
        id: string;
        name: string | null;
        image?: string | null;
    };
    genre?: Genre | null;
}

export interface VoiceWithOptionalUser extends Voice {
    user?: {
        name: string | null;
        image?: string | null;
    } | null;
    genre?: {
        id: string;
        name: string;
    } | null;
}

export interface CreateVoiceFormData {
    name: string;
    description?: string;
    isPublic: boolean;
    genreId?: string | null;
    gender?: string | null;
    duration?: number | null;
    audioSample?: string;
}

export interface UpdateVoiceFormData {
    name?: string;
    description?: string;
    isPublic?: boolean;
    genreId?: string | null;
    gender?: string | null;
    duration?: number | null;
}

export interface AudioUploadResponse {
    url: string;
    filename: string;
    duration?: number; // Duration from audio file analysis
}

export const GENDER_OPTIONS = [
    'Male',
    'Female',
    'Non-binary',
    'Neutral'
] as const;

export type GenderOption = typeof GENDER_OPTIONS[number];