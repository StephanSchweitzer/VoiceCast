import { Storage } from '@google-cloud/storage';

const storage = new Storage({
    projectId: process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT_ID,
});

const REFERENCE_AUDIO_BUCKET = process.env.REFERENCE_AUDIO_BUCKET!;
const GENERATED_AUDIO_BUCKET = process.env.GENERATED_AUDIO_BUCKET!;

export const storageService = {
    async uploadReferenceAudio(buffer: Buffer, filename: string): Promise<string> {
        const bucket = storage.bucket(REFERENCE_AUDIO_BUCKET);
        const file = bucket.file(filename);

        await file.save(buffer, {
            metadata: {
                contentType: 'audio/mpeg', // or determine from file extension
            },
        });

        return `gs://${REFERENCE_AUDIO_BUCKET}/${filename}`;
    },

    async uploadGeneratedAudio(buffer: Buffer, filename: string): Promise<string> {
        const bucket = storage.bucket(GENERATED_AUDIO_BUCKET);
        const file = bucket.file(filename);

        await file.save(buffer, {
            metadata: {
                contentType: 'audio/wav',
            },
        });

        return `gs://${GENERATED_AUDIO_BUCKET}/${filename}`;
    },

    async readFile(filePath: string): Promise<Buffer> {
        let bucketName: string;
        let fileName: string;

        if (filePath.startsWith(`gs://${REFERENCE_AUDIO_BUCKET}/`)) {
            bucketName = REFERENCE_AUDIO_BUCKET;
            fileName = filePath.replace(`gs://${REFERENCE_AUDIO_BUCKET}/`, '');
        } else if (filePath.startsWith(`gs://${GENERATED_AUDIO_BUCKET}/`)) {
            bucketName = GENERATED_AUDIO_BUCKET;
            fileName = filePath.replace(`gs://${GENERATED_AUDIO_BUCKET}/`, '');
        } else {
            throw new Error('Invalid file path format');
        }

        const bucket = storage.bucket(bucketName);
        const file = bucket.file(fileName);

        const [buffer] = await file.download();
        return buffer;
    },

    async deleteFile(filePath: string): Promise<void> {
        let bucketName: string;
        let fileName: string;

        if (filePath.startsWith(`gs://${REFERENCE_AUDIO_BUCKET}/`)) {
            bucketName = REFERENCE_AUDIO_BUCKET;
            fileName = filePath.replace(`gs://${REFERENCE_AUDIO_BUCKET}/`, '');
        } else if (filePath.startsWith(`gs://${GENERATED_AUDIO_BUCKET}/`)) {
            bucketName = GENERATED_AUDIO_BUCKET;
            fileName = filePath.replace(`gs://${GENERATED_AUDIO_BUCKET}/`, '');
        } else {
            throw new Error('Invalid file path format');
        }

        const bucket = storage.bucket(bucketName);
        const file = bucket.file(fileName);

        await file.delete();
    },

    // Generate a signed URL for file access (useful for serving audio files)
    async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
        let bucketName: string;
        let fileName: string;

        if (filePath.startsWith(`gs://${REFERENCE_AUDIO_BUCKET}/`)) {
            bucketName = REFERENCE_AUDIO_BUCKET;
            fileName = filePath.replace(`gs://${REFERENCE_AUDIO_BUCKET}/`, '');
        } else if (filePath.startsWith(`gs://${GENERATED_AUDIO_BUCKET}/`)) {
            bucketName = GENERATED_AUDIO_BUCKET;
            fileName = filePath.replace(`gs://${GENERATED_AUDIO_BUCKET}/`, '');
        } else {
            throw new Error('Invalid file path format');
        }

        const bucket = storage.bucket(bucketName);
        const file = bucket.file(fileName);

        const [signedUrl] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + expiresIn * 1000,
        });

        return signedUrl;
    }
};