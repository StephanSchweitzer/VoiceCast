import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const savedVoices = await prisma.savedVoice.findMany({
            where: { userId: session.user.id },
            include: {
                voice: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        audioSample: true,
                        duration: true,
                        gender: true,
                        createdAt: true,
                        user: {
                            select: {
                                name: true,
                                image: true
                            }
                        },
                        genre: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        const formattedVoices = savedVoices.map(savedVoice => ({
            ...savedVoice.voice,
            savedAt: savedVoice.createdAt
        }));

        return NextResponse.json(formattedVoices);
    } catch (error) {
        console.error('Error fetching saved voices:', error);
        return NextResponse.json(
            { message: 'Failed to fetch saved voices' },
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
        const { voiceId } = await request.json();

        if (!voiceId) {
            return NextResponse.json(
                { message: 'Voice ID is required' },
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

        if (!voice.isPublic && voice.userId !== session.user.id) {
            return NextResponse.json(
                { message: 'Cannot save private voice' },
                { status: 403 }
            );
        }

        const existingSave = await prisma.savedVoice.findUnique({
            where: {
                userId_voiceId: {
                    userId: session.user.id,
                    voiceId: voiceId
                }
            }
        });

        if (existingSave) {
            return NextResponse.json(
                { message: 'Voice already saved' },
                { status: 409 }
            );
        }

        const savedVoice = await prisma.savedVoice.create({
            data: {
                userId: session.user.id,
                voiceId: voiceId
            },
            include: {
                voice: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        audioSample: true,
                        duration: true,
                        gender: true,
                        createdAt: true,
                        user: {
                            select: {
                                name: true,
                                image: true
                            }
                        },
                        genre: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });

        return NextResponse.json({
            ...savedVoice.voice,
            savedAt: savedVoice.createdAt
        }, { status: 201 });
    } catch (error) {
        console.error('Error saving voice:', error);
        return NextResponse.json(
            { message: 'Failed to save voice' },
            { status: 500 }
        );
    }
}