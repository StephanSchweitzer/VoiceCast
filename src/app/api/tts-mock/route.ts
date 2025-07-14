import { NextRequest, NextResponse } from 'next/server';
import { storageService } from '@/lib/storage';

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

        const mockAudioGSPath = `gs://${process.env.GENERATED_AUDIO_BUCKET}/mock-files-sample.wav`;
        try {
            const audioBuffer = await storageService.readFile(mockAudioGSPath);

            const timestamp = Date.now();
            const filename = `mock-generated-${timestamp}.wav`;

            const savedFilePath = await storageService.uploadGeneratedAudio(audioBuffer, filename);

            const audioBase64 = audioBuffer.toString('base64');

            console.log('Mock TTS Voice Cloning called with:', {
                text: text?.slice(0, 50) + (text?.length > 50 ? '...' : ''),
                emotion: `arousal=${arousal}, valence=${valence}`,
                audioReferenceSize: `${Math.round(Buffer.from(audioReference, 'base64').length / 1024)}KB`,
                outputAudioSize: `${Math.round(audioBuffer.length / 1024)}KB`,
                savedToPath: savedFilePath
            });

            return NextResponse.json({
                success: true,
                audioData: audioBase64,
                filePath: savedFilePath, // This is the gs:// path that your real API will return
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

        } catch (fileError) {
            console.error('Mock audio file not found in cloud storage:', fileError);
            return NextResponse.json(
                {
                    success: false,
                    error: 'Mock audio file not found in cloud storage. Please upload sample.wav as mock-files-sample.wav to gs://' +
                        process.env.GENERATED_AUDIO_BUCKET
                },
                { status: 500 }
            );
        }

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