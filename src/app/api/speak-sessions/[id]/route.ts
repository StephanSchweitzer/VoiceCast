import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { storageService } from '@/lib/storage';

// GET /api/speak-sessions/[id] - Get session with generated audios
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const id = (await params).id;
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '15');
    const cursor = searchParams.get('cursor');

    try {
        // First verify session belongs to user
        const speakSession = await prisma.speakSession.findUnique({
            where: { id },
            select: { userId: true, name: true, createdAt: true, updatedAt: true, id: true }
        });

        if (!speakSession) {
            return NextResponse.json(
                { message: 'Session not found' },
                { status: 404 }
            );
        }

        if (speakSession.userId !== session.user.id) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Get generated audios for this session
        const generatedAudios = await prisma.generatedAudio.findMany({
            where: { sessionId: id },
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

        // Process URLs for both generated audios and voice samples
        const processedAudios = await Promise.all(
            audios.map(async (audio) => {
                let processedAudio = { ...audio };

                // Process generated audio filePath
                if (audio.filePath?.startsWith('gs://')) {
                    try {
                        processedAudio.filePath = await storageService.getSignedUrl(audio.filePath, 3600);
                    } catch (error) {
                        console.error('Error generating signed URL for generated audio:', error);
                        console.error('Audio ID:', audio.id, 'FilePath:', audio.filePath);
                    }
                }

                // Process voice audioSample
                if (audio.voice?.audioSample?.startsWith('gs://')) {
                    try {
                        processedAudio.voice = {
                            ...audio.voice,
                            audioSample: await storageService.getSignedUrl(audio.voice.audioSample, 3600)
                        };
                    } catch (error) {
                        console.error('Error generating signed URL for voice audio sample:', error);
                        console.error('Voice ID:', audio.voice.id, 'AudioSample:', audio.voice.audioSample);
                    }
                }

                return processedAudio;
            })
        );

        return NextResponse.json({
            session: speakSession,
            audios: processedAudios,
            hasMore,
            nextCursor
        });
    } catch (error) {
        console.error('Error fetching session:', error);
        return NextResponse.json(
            { message: 'Failed to fetch session' },
            { status: 500 }
        );
    }
}

// PATCH /api/speak-sessions/[id] - Update session name
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
        const { name } = await request.json();

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return NextResponse.json(
                { message: 'Valid name is required' },
                { status: 400 }
            );
        }

        const speakSession = await prisma.speakSession.findUnique({
            where: { id }
        });

        if (!speakSession) {
            return NextResponse.json(
                { message: 'Session not found' },
                { status: 404 }
            );
        }

        if (speakSession.userId !== session.user.id) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 403 }
            );
        }

        const updatedSession = await prisma.speakSession.update({
            where: { id },
            data: {
                name: name.trim(),
                updatedAt: new Date()
            },
            include: {
                _count: {
                    select: {
                        generatedAudios: true
                    }
                }
            }
        });

        return NextResponse.json(updatedSession);
    } catch (error) {
        console.error('Error updating session:', error);
        return NextResponse.json(
            { message: 'Failed to update session' },
            { status: 500 }
        );
    }
}

// DELETE /api/speak-sessions/[id] - Delete session and all its audios
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
        const speakSession = await prisma.speakSession.findUnique({
            where: { id },
            include: {
                generatedAudios: {
                    select: {
                        id: true,
                        filePath: true
                    }
                }
            }
        });

        if (!speakSession) {
            return NextResponse.json(
                { message: 'Session not found' },
                { status: 404 }
            );
        }

        if (speakSession.userId !== session.user.id) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Delete audio files from cloud storage
        const deletePromises = speakSession.generatedAudios
            .filter(audio => audio.filePath?.startsWith('gs://'))
            .map(async (audio) => {
                try {
                    await storageService.deleteFile(audio.filePath!);
                } catch (error) {
                    console.warn('Could not delete audio file:', audio.filePath, error);
                }
            });

        await Promise.all(deletePromises);

        // Delete the session (cascades to generated audios)
        await prisma.speakSession.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Session deleted successfully' });
    } catch (error) {
        console.error('Error deleting session:', error);
        return NextResponse.json(
            { message: 'Failed to delete session' },
            { status: 500 }
        );
    }
}