import { Storage } from '@google-cloud/storage';
import ffmpeg from 'fluent-ffmpeg';
import { tmpdir } from 'os';
import { promises as fs } from 'fs';
import path from 'path';

const storage = new Storage({
    projectId: process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT_ID,
});

const REFERENCE_AUDIO_BUCKET = process.env.REFERENCE_AUDIO_BUCKET!;
const GENERATED_AUDIO_BUCKET = process.env.GENERATED_AUDIO_BUCKET!;

// Helper function to validate WAV format
function isValidWavBuffer(buffer: Buffer): boolean {
    if (buffer.length < 12) return false;
    const riffHeader = buffer.slice(0, 4).toString();
    const waveHeader = buffer.slice(8, 12).toString();
    return riffHeader === 'RIFF' && waveHeader === 'WAVE';
}

// Helper function to detect audio format
function detectAudioFormat(buffer: Buffer): string {
    const header = buffer.slice(0, 12);

    if (header.slice(0, 4).toString() === 'RIFF') {
        return 'WAV';
    }
    if (header[0] === 0x1a && header[1] === 0x45 && header[2] === 0xdf && header[3] === 0xa3) {
        return 'WebM';
    }
    if (header.slice(0, 3).toString() === 'ID3' || (header[0] === 0xff && (header[1] & 0xe0) === 0xe0)) {
        return 'MP3';
    }
    if (header.slice(4, 8).toString() === 'ftyp') {
        return 'M4A/MP4';
    }
    if (header.slice(0, 4).toString() === 'OggS') {
        return 'OGG';
    }

    return 'Unknown';
}

// Audio conversion using system FFmpeg
async function convertToWav(inputBuffer: Buffer): Promise<Buffer> {
    const tempDir = tmpdir();
    const inputFile = path.join(tempDir, `input_${Date.now()}.webm`);
    const outputFile = path.join(tempDir, `output_${Date.now()}.wav`);

    try {
        console.log('🔄 Converting to WAV using system FFmpeg...');

        // Write input buffer to temporary file
        await fs.writeFile(inputFile, inputBuffer);

        // Convert using fluent-ffmpeg with system FFmpeg
        await new Promise<void>((resolve, reject) => {
            ffmpeg(inputFile)
                .audioFrequency(22050)    // XTTS-V2 preferred sample rate
                .audioChannels(1)         // Mono
                .audioCodec('pcm_s16le')  // 16-bit PCM
                .format('wav')            // WAV format
                .on('end', () => {
                    console.log('✅ FFmpeg conversion completed');
                    resolve();
                })
                .on('error', (err) => {
                    console.error('❌ FFmpeg conversion failed:', err);
                    reject(new Error(`FFmpeg conversion failed: ${err.message}`));
                })
                .save(outputFile);
        });

        // Read the converted file
        const outputBuffer = await fs.readFile(outputFile);

        console.log('✅ Audio converted to WAV successfully');
        return outputBuffer;

    } catch (error) {
        console.error('❌ WAV conversion failed:', error);
        throw new Error(`Failed to convert audio to WAV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
        // Clean up temporary files
        try {
            await fs.unlink(inputFile).catch(() => {});
            await fs.unlink(outputFile).catch(() => {});
        } catch {
            // Ignore cleanup errors
        }
    }
}

export const storageService = {
    async uploadReferenceAudio(buffer: Buffer, filename: string): Promise<string> {
        const bucket = storage.bucket(REFERENCE_AUDIO_BUCKET);

        // Ensure filename ends with .wav
        const wavFilename = filename.replace(/\.[^.]+$/, '.wav');
        const file = bucket.file(wavFilename);

        let finalBuffer = buffer;
        const detectedFormat = detectAudioFormat(buffer);

        // Convert to WAV if not already in WAV format
        if (!isValidWavBuffer(buffer)) {
            console.log(`🔄 Converting ${detectedFormat} to WAV format...`);
            try {
                finalBuffer = await convertToWav(buffer);
                console.log(`✅ Successfully converted ${detectedFormat} to WAV`);
            } catch (error) {
                console.error(`❌ Failed to convert ${detectedFormat} to WAV:`, error);
                throw new Error(`Failed to convert audio to WAV format: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        } else {
            console.log(`✅ Uploading valid WAV file: ${wavFilename}`);
        }

        await file.save(finalBuffer, {
            metadata: {
                contentType: 'audio/wav',
                originalFormat: detectedFormat,
                convertedAt: new Date().toISOString(),
            },
        });

        console.log(`✅ Successfully uploaded WAV file: ${wavFilename}`);
        return `gs://${REFERENCE_AUDIO_BUCKET}/${wavFilename}`;
    },

    async uploadGeneratedAudio(buffer: Buffer, filename: string): Promise<string> {
        const bucket = storage.bucket(GENERATED_AUDIO_BUCKET);

        // Ensure filename ends with .wav
        const wavFilename = filename.replace(/\.[^.]+$/, '.wav');
        const file = bucket.file(wavFilename);

        // Generated audio should always be WAV, but verify and convert if needed
        if (!isValidWavBuffer(buffer)) {
            console.warn(`⚠️  Generated audio is not in WAV format!`);
            const detectedFormat = detectAudioFormat(buffer);
            console.log(`Detected format: ${detectedFormat}, converting to WAV...`);

            try {
                buffer = await convertToWav(buffer);
                console.log(`✅ Converted generated audio to WAV`);
            } catch (error) {
                console.error(`❌ Failed to convert generated audio:`, error);
                throw new Error(`Generated audio conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        await file.save(buffer, {
            metadata: {
                contentType: 'audio/wav',
                generatedAt: new Date().toISOString(),
            },
        });

        console.log(`✅ Successfully uploaded generated WAV file: ${wavFilename}`);
        return `gs://${GENERATED_AUDIO_BUCKET}/${wavFilename}`;
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
            throw new Error('Invalid file path format. Expected gs:// URL.');
        }

        const bucket = storage.bucket(bucketName);
        const file = bucket.file(fileName);

        try {
            const [buffer] = await file.download();

            // Verify what we downloaded
            const detectedFormat = detectAudioFormat(buffer);
            const isValidWav = isValidWavBuffer(buffer);

            console.log(`📁 Downloaded ${fileName}: ${detectedFormat} format, ${buffer.length} bytes, Valid WAV: ${isValidWav}`);

            if (!isValidWav) {
                console.warn(`⚠️  Downloaded file is not valid WAV format: ${detectedFormat}`);
            }

            return buffer;
        } catch (error) {
            console.error(`❌ Failed to download file: ${fileName}`, error);
            throw new Error(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
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
            throw new Error('Invalid file path format. Expected gs:// URL.');
        }

        const bucket = storage.bucket(bucketName);
        const file = bucket.file(fileName);

        try {
            await file.delete();
            console.log(`🗑️  Successfully deleted: ${fileName}`);
        } catch (error) {
            console.error(`❌ Failed to delete file: ${fileName}`, error);
            throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },

    // Generate a signed URL for file access
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
            throw new Error('Invalid file path format. Expected gs:// URL.');
        }

        const bucket = storage.bucket(bucketName);
        const file = bucket.file(fileName);

        try {
            const [signedUrl] = await file.getSignedUrl({
                action: 'read',
                expires: Date.now() + expiresIn * 1000,
            });

            return signedUrl;
        } catch (error) {
            console.error(`❌ Failed to generate signed URL for: ${fileName}`, error);
            throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
};