import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isUserAdmin } from '@/lib/utils/admin';
import { z } from 'zod';

// Validation schemas
const createGenreSchema = z.object({
    name: z.string().min(1, 'Genre name is required').max(50, 'Genre name must be 50 characters or less'),
});

export async function GET() {
    try {
        const genres = await prisma.genre.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { voices: true }
                }
            }
        });

        return NextResponse.json(genres);
    } catch (error) {
        console.error('Error fetching genres:', error);
        return NextResponse.json(
            { message: 'Failed to fetch genres' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
        }

        if (!isUserAdmin(session)) {
            return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const validatedData = createGenreSchema.parse(body);

        // Check if genre already exists
        const existingGenre = await prisma.genre.findUnique({
            where: { name: validatedData.name }
        });

        if (existingGenre) {
            return NextResponse.json(
                { message: 'A genre with this name already exists' },
                { status: 409 }
            );
        }

        const genre = await prisma.genre.create({
            data: validatedData,
        });

        return NextResponse.json(genre, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { message: 'Validation failed', errors: error.errors },
                { status: 400 }
            );
        }

        console.error('Error creating genre:', error);
        return NextResponse.json(
            { message: 'Failed to create genre' },
            { status: 500 }
        );
    }
}