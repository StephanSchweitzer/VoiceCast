// Base Genre interface
export interface Genre {
    id: string;
    name: string;
    createdAt: Date;
}

// Base Voice interface
export interface Voice {
    id: string;
    name: string;
    description?: string | null;
    audioSample: string;
    isPublic: boolean;
    gender?: string | null;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    genreId?: string | null;
}

// Voice with User information
export interface VoiceWithUser extends Voice {
    user: {
        id: string;
        name: string | null;
    };
}

// Voice with Genre information
export interface VoiceWithGenre extends Voice {
    genre?: Genre | null;
}

// Voice with both User and Genre information
export interface VoiceWithUserAndGenre extends Voice {
    user: {
        id: string;
        name: string | null;
    };
    genre?: Genre | null;
}

// For API responses that might include user info on public voices
export interface VoiceWithOptionalUser extends Voice {
    duration?: number | null;
    user?: {
        name: string | null;
        image?: string | null;
    } | null;
    genre?: {
        id: string;
        name: string;
    } | null;
}

// Form data for creating/updating voices
export interface CreateVoiceFormData {
    name: string;
    description?: string;
    isPublic: boolean;
    genreId?: string | null;
    gender?: string | null;
    audioSample?: string;
}

export interface UpdateVoiceFormData {
    name?: string;
    description?: string;
    isPublic?: boolean;
    genreId?: string | null;
    gender?: string | null;
}

// Audio upload response
export interface AudioUploadResponse {
    url: string;
    filename: string;
}

// Gender options (for forms)
export const GENDER_OPTIONS = [
    'Male',
    'Female',
    'Non-binary',
    'Neutral'
] as const;

export type GenderOption = typeof GENDER_OPTIONS[number];