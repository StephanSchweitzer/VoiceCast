import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { unlink, writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const EMOTION_MAPPINGS = {
    neutral: { arousal: 0.5, valence: 0.5 },
    happy: { arousal: 0.8, valence: 0.8 },
    sad: { arousal: 0.3, valence: 0.2 },
    angry: { arousal: 0.9, valence: 0.1 },
    fearful: { arousal: 0.8, valence: 0.3 },
    surprised: { arousal: 0.7, valence: 0.6 }
} as const;

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '15');
    const cursor = searchParams.get('cursor'); // For pagination

    try {
        const generatedAudios = await prisma.generatedAudio.findMany({
            where: { userId: session.user.id },
            include: {
                voice: {
                    select: {
                        id: true,
                        name: true,
                        audioSample: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit + 1,
            ...(cursor && {
                cursor: {
                    id: cursor
                },
                skip: 1
            })
        });

        const hasMore = generatedAudios.length > limit;
        const audios = hasMore ? generatedAudios.slice(0, -1) : generatedAudios;
        const nextCursor = hasMore ? audios[audios.length - 1].id : null;

        return NextResponse.json({
            audios,
            hasMore,
            nextCursor
        });
    } catch (error) {
        console.error('Error fetching generated audio:', error);
        return NextResponse.json(
            { message: 'Failed to fetch generated audio' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { text, voiceId, emotion } = await request.json();

        if (!text || !voiceId || !emotion) {
            return NextResponse.json(
                { message: 'Text, voice ID, and emotion are required' },
                { status: 400 }
            );
        }

        if (!(emotion in EMOTION_MAPPINGS)) {
            return NextResponse.json(
                { message: 'Invalid emotion' },
                { status: 400 }
            );
        }

        const voice = await prisma.voice.findUnique({
            where: { id: voiceId }
        });

        if (!voice) {
            return NextResponse.json(
                { message: 'Voice not found' },
                { status: 404 }
            );
        }

        const hasAccess = voice.userId === session.user.id ||
            voice.isPublic ||
            await prisma.savedVoice.findUnique({
                where: {
                    userId_voiceId: {
                        userId: session.user.id,
                        voiceId: voiceId
                    }
                }
            });

        if (!hasAccess) {
            return NextResponse.json(
                { message: 'Access denied to this voice' },
                { status: 403 }
            );
        }

        const { arousal, valence } = EMOTION_MAPPINGS[emotion as keyof typeof EMOTION_MAPPINGS];

        // Get the voice sample audio for voice cloning
        // voice.audioSample contains path like "/uploads/filename.wav"
        const audioPath = join(process.cwd(), 'public', voice.audioSample);
        const audioBuffer = await readFile(audioPath);
        const audioSampleData = audioBuffer.toString('base64');

        // TODO: Replace '/api/tts-mock' with '/api/tts' when ready for production
        const ttsResponse = await fetch(new URL('/api/tts-mock', request.url), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text,
                audioReference: audioSampleData, // Pass the actual audio data
                arousal,
                valence
            }),
        });

        const ttsResult = await ttsResponse.json();

        if (!ttsResponse.ok) {
            throw new Error(ttsResult.error || 'Failed to generate speech');
        }

        if (!ttsResult.success || !ttsResult.audioData) {
            throw new Error('No audio data received from TTS service');
        }

        // Create the generated-audios directory if it doesn't exist
        const generatedAudiosDir = join(process.cwd(), 'public', 'generated-audios');
        if (!existsSync(generatedAudiosDir)) {
            await mkdir(generatedAudiosDir, { recursive: true });
        }

        // Generate filename and save the audio
        const filename = `${Date.now()}_${Math.random().toString(36).substring(2)}.wav`;
        const fullLocalPath = join(generatedAudiosDir, filename);

        const buffer = Buffer.from(ttsResult.audioData, 'base64');
        await writeFile(fullLocalPath, buffer);
        const localFilePath = `/generated-audios/${filename}`;

        // Save to database with local file path
        const generatedAudio = await prisma.generatedAudio.create({
            data: {
                userId: session.user.id,
                voiceId,
                text,
                emotion,
                arousal,
                valence,
                filePath: localFilePath
            },
            include: {
                voice: {
                    select: {
                        id: true,
                        name: true,
                        audioSample: true
                    }
                }
            }
        });

        return NextResponse.json(generatedAudio, { status: 201 });
    } catch (error) {
        console.error('Error generating audio:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to generate audio';
        return NextResponse.json(
            { message: errorMessage },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const id = (await params).id;
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { isLiked } = await request.json();

        if (isLiked !== null && typeof isLiked !== 'boolean') {
            return NextResponse.json(
                { message: 'isLiked must be a boolean or null' },
                { status: 400 }
            );
        }

        const generatedAudio = await prisma.generatedAudio.findUnique({
            where: { id }
        });

        if (!generatedAudio) {
            return NextResponse.json(
                { message: 'Generated audio not found' },
                { status: 404 }
            );
        }

        if (generatedAudio.userId !== session.user.id) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 403 }
            );
        }

        const updatedAudio = await prisma.generatedAudio.update({
            where: { id },
            data: { isLiked },
            include: {
                voice: {
                    select: {
                        id: true,
                        name: true,
                        audioSample: true
                    }
                }
            }
        });

        return NextResponse.json(updatedAudio);
    } catch (error) {
        console.error('Error updating like status:', error);
        return NextResponse.json(
            { message: 'Failed to update like status' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const id = (await params).id;
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const generatedAudio = await prisma.generatedAudio.findUnique({
            where: { id }
        });

        if (!generatedAudio) {
            return NextResponse.json(
                { message: 'Generated audio not found' },
                { status: 404 }
            );
        }

        if (generatedAudio.userId !== session.user.id) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Delete from database first
        await prisma.generatedAudio.delete({
            where: { id }
        });

        // Delete the generated audio file from public/generated-audios/
        if (generatedAudio.filePath && !generatedAudio.filePath.startsWith('http')) {
            try {
                const fullPath = join(process.cwd(), 'public', generatedAudio.filePath);
                await unlink(fullPath);
            } catch (fileError) {
                console.warn('Could not delete generated audio file:', fileError);
                // Don't fail the request if file deletion fails
            }
        }

        return NextResponse.json({ message: 'Generated audio deleted successfully' });
    } catch (error) {
        console.error('Error deleting generated audio:', error);
        return NextResponse.json(
            { message: 'Failed to delete generated audio' },
            { status: 500 }
        );
    }
}