// app/api/genres/route.ts - Create this if it doesn't exist
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
    try {
        // Optional: Check authentication if genres are user-specific
        // const session = await getServerSession(authOptions);
        // if (!session) {
        //     return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        // }

        const genres = await prisma.genre.findMany({
            orderBy: { name: 'asc' }
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