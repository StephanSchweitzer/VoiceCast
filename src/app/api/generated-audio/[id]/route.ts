import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { storageService} from "@/lib/storage";

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

        if (generatedAudio.filePath && generatedAudio.filePath.startsWith('gs://')) {
            try {
                await storageService.deleteFile(generatedAudio.filePath);
            } catch (fileError) {
                console.warn('Could not delete generated audio file:', fileError);
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