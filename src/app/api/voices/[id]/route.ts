import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { storageService } from "@/lib/storage";

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

        if (!voice.isPublic && voice.userId !== session?.user?.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        let processedVoice = { ...voice };
        if (voice.audioSample?.startsWith('gs://')) {
            try {
                console.log('Original audioSample:', voice.audioSample);
                processedVoice.audioSample = await storageService.getSignedUrl(voice.audioSample, 3600);
                console.log('Generated signed URL:', processedVoice.audioSample);
            } catch (error) {
                console.error('Error generating signed URL for voice audio:', error);
                console.error('Error details:', error);
            }
        }

        return NextResponse.json(processedVoice);
    } catch (error) {
        console.error('Error fetching voice:', error);
        return NextResponse.json(
            { message: 'Failed to fetch voice' },
            { status: 500 }
        );
    }
}

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
        const { name, description, isPublic, genreId, gender, duration } = body;

        const voice = await prisma.voice.findUnique({
            where: { id }
        });

        if (!voice) {
            return NextResponse.json({ message: 'Voice not found' }, { status: 404 });
        }

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
                ...(duration !== undefined && { duration })
            },
            select: {
                id: true,
                name: true,
                description: true,
                isPublic: true,
                audioSample: true,
                duration: true,
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

        let processedUpdatedVoice = { ...updatedVoice };
        if (updatedVoice.audioSample?.startsWith('gs://')) {
            try {
                processedUpdatedVoice.audioSample = await storageService.getSignedUrl(updatedVoice.audioSample, 3600);
            } catch (error) {
                console.error('Error generating signed URL for updated voice:', error);
            }
        }

        return NextResponse.json(processedUpdatedVoice);
    } catch (error) {
        console.error('Error updating voice:', error);
        return NextResponse.json(
            { message: 'Failed to update voice' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return PUT(request, { params });
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
        const voice = await prisma.voice.findUnique({
            where: { id }
        });

        if (!voice) {
            return NextResponse.json({ message: 'Voice not found' }, { status: 404 });
        }

        if (voice.userId !== session.user.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
        }

        await prisma.voice.delete({
            where: { id }
        });

        if (voice.audioSample && voice.audioSample.startsWith('gs://')) {
            try {
                await storageService.deleteFile(voice.audioSample);
            } catch (fileError) {
                console.warn('Could not delete audio file:', fileError);
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