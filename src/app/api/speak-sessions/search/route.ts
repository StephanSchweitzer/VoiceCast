import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '30');
    const cursor = searchParams.get('cursor');

    try {
        // Build the where clause for searching
        const whereClause: any = {
            userId: session.user.id,
        };

        // If there's a search query, search both session names and generated audio text
        if (query.trim()) {
            whereClause.OR = [
                {
                    name: {
                        contains: query.trim(),
                        mode: 'insensitive'
                    }
                },
                {
                    generatedAudios: {
                        some: {
                            text: {
                                contains: query.trim(),
                                mode: 'insensitive'
                            }
                        }
                    }
                }
            ];
        }

        // Get sessions with pagination
        const sessions = await prisma.speakSession.findMany({
            where: whereClause,
            include: {
                _count: {
                    select: {
                        generatedAudios: true
                    }
                },
                // Include a preview of the latest generated audio for context
                generatedAudios: {
                    select: {
                        id: true,
                        text: true,
                        createdAt: true,
                        emotion: true,
                        voice: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1
                }
            },
            orderBy: {
                updatedAt: 'desc'
            },
            take: limit + 1,
            ...(cursor && {
                cursor: {
                    id: cursor
                },
                skip: 1
            })
        });

        const hasMore = sessions.length > limit;
        const results = hasMore ? sessions.slice(0, -1) : sessions;
        const nextCursor = hasMore ? results[results.length - 1].id : null;

        // Transform the data to include preview info
        const transformedResults = results.map(session => ({
            id: session.id,
            name: session.name,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
            audioCount: session._count.generatedAudios,
            latestAudio: session.generatedAudios[0] || null
        }));

        return NextResponse.json({
            sessions: transformedResults,
            hasMore,
            nextCursor,
            total: results.length
        });
    } catch (error) {
        console.error('Error searching speak sessions:', error);
        return NextResponse.json(
            { message: 'Failed to search speak sessions' },
            { status: 500 }
        );
    }
}