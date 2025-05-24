export interface Genre {
    id: string;
    name: string;
    createdAt: Date;
    _count?: {
        voices: number;
    };
}

export interface CreateGenreData {
    name: string;
}

export interface UpdateGenreData {
    name: string;
}

export interface ApiError {
    message: string;
    errors?: any[];
    voiceCount?: number;
}