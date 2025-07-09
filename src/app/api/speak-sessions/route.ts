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
        const sessions = await prisma.speakSession.findMany({
            where: { userId: session.user.id },
            include: {
                _count: {
                    select: {
                        generatedAudios: true
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        return NextResponse.json(sessions);
    } catch (error) {
        console.error('Error fetching speak sessions:', error);
        return NextResponse.json(
            { message: 'Failed to fetch speak sessions' },
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
        const { name } = await request.json();

        // If no name provided, generate one based on existing sessions count
        let sessionName = name;
        if (!sessionName) {
            const sessionCount = await prisma.speakSession.count({
                where: { userId: session.user.id }
            });
            sessionName = `Session ${sessionCount + 1}`;
        }

        const newSession = await prisma.speakSession.create({
            data: {
                name: sessionName,
                userId: session.user.id
            },
            include: {
                _count: {
                    select: {
                        generatedAudios: true
                    }
                }
            }
        });

        return NextResponse.json(newSession, { status: 201 });
    } catch (error) {
        console.error('Error creating speak session:', error);
        return NextResponse.json(
            { message: 'Failed to create speak session' },
            { status: 500 }
        );
    }
}