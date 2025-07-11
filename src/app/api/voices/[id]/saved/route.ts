import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const voiceId = (await params).id;

        // Check if the voice exists and is accessible
        const voice = await prisma.voice.findUnique({
            where: { id: voiceId },
            select: {
                id: true,
                isPublic: true,
                userId: true
            }
        });

        if (!voice) {
            return NextResponse.json(
                { error: 'Voice not found' },
                { status: 404 }
            );
        }

        // Check if user can access this voice (public or owns it)
        const canAccess = voice.isPublic || voice.userId === session.user.id;
        if (!canAccess) {
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            );
        }

        // Check if voice is saved by the current user
        const savedVoice = await prisma.savedVoice.findUnique({
            where: {
                userId_voiceId: {
                    userId: session.user.id,
                    voiceId: voiceId
                }
            }
        });

        return NextResponse.json({
            isSaved: !!savedVoice
        });

    } catch (error) {
        console.error('Error checking saved voice status:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const voiceId = (await params).id;

        // Check if the voice exists and is accessible
        const voice = await prisma.voice.findUnique({
            where: { id: voiceId },
            select: {
                id: true,
                isPublic: true,
                userId: true,
                name: true
            }
        });

        if (!voice) {
            return NextResponse.json(
                { error: 'Voice not found' },
                { status: 404 }
            );
        }

        // Check if user can access this voice (public or owns it)
        const canAccess = voice.isPublic || voice.userId === session.user.id;
        if (!canAccess) {
            return NextResponse.json(
                { error: 'Access denied - this voice is private' },
                { status: 403 }
            );
        }

        // Prevent users from saving their own voices
        if (voice.userId === session.user.id) {
            return NextResponse.json(
                { error: 'You cannot save your own voice' },
                { status: 400 }
            );
        }

        // Check if already saved
        const existingSavedVoice = await prisma.savedVoice.findUnique({
            where: {
                userId_voiceId: {
                    userId: session.user.id,
                    voiceId: voiceId
                }
            }
        });

        if (existingSavedVoice) {
            return NextResponse.json(
                { error: 'Voice is already saved to your library' },
                { status: 400 }
            );
        }

        // Create saved voice record
        const savedVoice = await prisma.savedVoice.create({
            data: {
                userId: session.user.id,
                voiceId: voiceId
            },
            include: {
                voice: {
                    select: {
                        name: true
                    }
                }
            }
        });

        return NextResponse.json({
            success: true,
            message: `"${savedVoice.voice.name}" has been saved to your library`,
            savedVoice: {
                id: savedVoice.id,
                createdAt: savedVoice.createdAt
            }
        });

    } catch (error) {
        console.error('Error saving voice:', error);

        // Handle unique constraint violation
        if (error instanceof Error && error.message.includes('Unique constraint')) {
            return NextResponse.json(
                { error: 'Voice is already saved to your library' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to save voice to library' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const voiceId = (await params).id;

        // Check if the saved voice exists
        const savedVoice = await prisma.savedVoice.findUnique({
            where: {
                userId_voiceId: {
                    userId: session.user.id,
                    voiceId: voiceId
                }
            },
            include: {
                voice: {
                    select: {
                        name: true
                    }
                }
            }
        });

        if (!savedVoice) {
            return NextResponse.json(
                { error: 'Voice is not saved in your library' },
                { status: 404 }
            );
        }

        // Delete the saved voice record
        await prisma.savedVoice.delete({
            where: {
                userId_voiceId: {
                    userId: session.user.id,
                    voiceId: voiceId
                }
            }
        });

        return NextResponse.json({
            success: true,
            message: `"${savedVoice.voice.name}" has been removed from your library`
        });

    } catch (error) {
        console.error('Error removing saved voice:', error);
        return NextResponse.json(
            { error: 'Failed to remove voice from library' },
            { status: 500 }
        );
    }
}