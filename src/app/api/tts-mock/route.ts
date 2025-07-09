import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
    try {
        const { text, audioReference, arousal, valence } = await request.json();

        if (!text || !audioReference || arousal === undefined || valence === undefined) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing required parameters: text, audioReference, arousal, and valence are required'
                },
                { status: 400 }
            );
        }

        // Simulate processing time for voice cloning
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Path to the mock audio file that will be returned
        const mockAudioPath = join(process.cwd(), 'public', 'test-audio', 'sample.wav');

        // Check if the mock audio file exists
        if (!existsSync(mockAudioPath)) {
            console.error('Mock audio file not found at:', mockAudioPath);
            return NextResponse.json(
                {
                    success: false,
                    error: 'Mock audio file not found. Please add a sample.wav file to public/test-audio/'
                },
                { status: 500 }
            );
        }

        // Read the mock generated audio file
        const audioBuffer = await readFile(mockAudioPath);
        const audioBase64 = audioBuffer.toString('base64');

        // Log what the TTS service received (for debugging)
        console.log('Mock TTS Voice Cloning called with:', {
            text: text?.slice(0, 50) + (text?.length > 50 ? '...' : ''),
            emotion: `arousal=${arousal}, valence=${valence}`,
            audioReferenceSize: `${Math.round(Buffer.from(audioReference, 'base64').length / 1024)}KB`,
            outputAudioSize: `${Math.round(audioBuffer.length / 1024)}KB`
        });

        return NextResponse.json({
            success: true,
            audioData: audioBase64,
            metadata: {
                text,
                arousal,
                valence,
                duration: 2.5, // Mock duration
                generatedAt: new Date().toISOString(),
                format: 'wav',
                encoding: 'base64'
            }
        });

    } catch (error) {
        console.error('Mock TTS error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Mock TTS failed: ' + (error instanceof Error ? error.message : 'Unknown error')
            },
            { status: 500 }
        );
    }
}