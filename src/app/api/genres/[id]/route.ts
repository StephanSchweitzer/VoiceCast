import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isUserAdmin } from '@/lib/utils/admin';
import { z } from 'zod';

const updateGenreSchema = z.object({
    name: z.string().min(1, 'Genre name is required').max(50, 'Genre name must be 50 characters or less'),
});

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
        }

        if (!isUserAdmin(session)) {
            return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const validatedData = updateGenreSchema.parse(body);

        // Check if genre exists
        const existingGenre = await prisma.genre.findUnique({
            where: { id }
        });

        if (!existingGenre) {
            return NextResponse.json({ message: 'Genre not found' }, { status: 404 });
        }

        // Check if another genre with the same name exists (excluding current)
        const duplicateGenre = await prisma.genre.findFirst({
            where: {
                name: validatedData.name,
                id: { not: id }
            }
        });

        if (duplicateGenre) {
            return NextResponse.json(
                { message: 'A genre with this name already exists' },
                { status: 409 }
            );
        }

        const updatedGenre = await prisma.genre.update({
            where: { id },
            data: validatedData,
        });

        return NextResponse.json(updatedGenre);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { message: 'Validation failed', errors: error.errors },
                { status: 400 }
            );
        }

        console.error('Error updating genre:', error);
        return NextResponse.json(
            { message: 'Failed to update genre' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
        }

        if (!isUserAdmin(session)) {
            return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
        }

        const { id } = await params;

        // Check if genre exists and count associated voices
        const genre = await prisma.genre.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { voices: true }
                }
            }
        });

        if (!genre) {
            return NextResponse.json({ message: 'Genre not found' }, { status: 404 });
        }

        // Check if there are voices associated with this genre
        if (genre._count.voices > 0) {
            return NextResponse.json(
                {
                    message: `Cannot delete genre. It has ${genre._count.voices} associated voice(s). Please reassign or remove the voices first.`,
                    voiceCount: genre._count.voices
                },
                { status: 409 }
            );
        }

        await prisma.genre.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'Genre deleted successfully' });
    } catch (error) {
        console.error('Error deleting genre:', error);
        return NextResponse.json(
            { message: 'Failed to delete genre' },
            { status: 500 }
        );
    }
}