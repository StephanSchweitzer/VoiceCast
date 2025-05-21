import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const id = (await params).id;
    const session = await getServerSession(authOptions);

    try {
        const voice = await prisma.voice.findUnique({
            where: { id }
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
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Delete the voice
        await prisma.voice.delete({
            where: { id }
        });

        // TODO: Delete the associated audio file

        return NextResponse.json({ message: 'Voice deleted successfully' });
    } catch (error) {
        console.error('Error deleting voice:', error);
        return NextResponse.json(
            { message: 'Failed to delete voice' },
            { status: 500 }
        );
    }
}