import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { unlink } from 'fs/promises';
import { join } from 'path';

// GET - Fetch individual voice
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const id = (await params).id;
    const session = await getServerSession(authOptions);

    try {
        const voice = await prisma.voice.findUnique({
            where: { id },
            include: {
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
        });

        if (!voice) {
            return NextResponse.json({ message: 'Voice not found' }, { status: 404 });
        }

        // Check if the user has access to this voice
        if (!voice.isPublic && voice.userId !== session?.user?.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json(voice);
    } catch (error) {
        console.error('Error fetching voice:', error);
        return NextResponse.json(
            { message: 'Failed to fetch voice' },
            { status: 500 }
        );
    }
}

// PUT - Update voice
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const id = (await params).id;
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { name, description, isPublic, genreId, gender, duration } = body; // ADD: Accept duration

        const voice = await prisma.voice.findUnique({
            where: { id }
        });

        if (!voice) {
            return NextResponse.json({ message: 'Voice not found' }, { status: 404 });
        }

        // Check if the user owns this voice
        if (voice.userId !== session.user.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
        }

        const updatedVoice = await prisma.voice.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(isPublic !== undefined && { isPublic }),
                ...(genreId !== undefined && { genreId: genreId || null }),
                ...(gender !== undefined && { gender: gender || null }),
                ...(duration !== undefined && { duration }) // ADD: Allow duration updates
            },
            select: {
                id: true,
                name: true,
                description: true,
                isPublic: true,
                audioSample: true,
                duration: true, // ADD: Include duration in response
                gender: true,
                createdAt: true,
                updatedAt: true,
                userId: true,
                genre: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        return NextResponse.json(updatedVoice);
    } catch (error) {
        console.error('Error updating voice:', error);
        return NextResponse.json(
            { message: 'Failed to update voice' },
            { status: 500 }
        );
    }
}

// PATCH - Update voice metadata (for the edit form)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return PUT(request, { params });
}

// DELETE - Delete voice
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
        const voice = await prisma.voice.findUnique({
            where: { id }
        });

        if (!voice) {
            return NextResponse.json({ message: 'Voice not found' }, { status: 404 });
        }

        // Check if the user owns this voice
        if (voice.userId !== session.user.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
        }

        // Delete the voice from database
        await prisma.voice.delete({
            where: { id }
        });

        // Delete the associated audio file if it's a local upload
        if (voice.audioSample && voice.audioSample.startsWith('/uploads/')) {
            try {
                const filename = voice.audioSample.replace('/uploads/', '');
                const filepath = join(process.cwd(), 'public', 'uploads', filename);
                await unlink(filepath);
            } catch (fileError) {
                console.warn('Could not delete audio file:', fileError);
                // Continue anyway - the database record is deleted
            }
        }

        return NextResponse.json({ message: 'Voice deleted successfully' });
    } catch (error) {
        console.error('Error deleting voice:', error);
        return NextResponse.json(
            { message: 'Failed to delete voice' },
            { status: 500 }
        );
    }
}