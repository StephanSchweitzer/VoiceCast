export interface Voice {
    id: string;
    name: string;
    description?: string | null;
    audioSample: string;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
}

export interface VoiceWithUser extends Voice {
    user: {
        id: string;
        name: string | null;
    };
}