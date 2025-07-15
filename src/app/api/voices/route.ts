import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { storageService } from "@/lib/storage";

// GET - Fetch voices
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'user', 'public', or 'all'

    try {
        let whereClause = {};

        if (type === 'user') {
            // User's own voices - requires authentication
            if (!session) {
                return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
            }
            whereClause = { userId: session.user.id };
        } else if (type === 'public') {
            // Public voices only
            whereClause = { isPublic: true };
        } else {
            // All accessible voices (user's own + public)
            if (session) {
                whereClause = {
                    OR: [
                        { userId: session.user.id },
                        { isPublic: true }
                    ]
                };
            } else {
                whereClause = { isPublic: true };
            }
        }

        const voices = await prisma.voice.findMany({
            where: whereClause,
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
                },
                // Include user info for public voices
                user: type === 'public' ? {
                    select: {
                        name: true,
                        image: true
                    }
                } : false,
                // Use _count to check if voice is saved by current user
                _count: session ? {
                    select: {
                        savedBy: {
                            where: {
                                userId: session.user.id
                            }
                        }
                    }
                } : false
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        // Transform the result to include isSaved boolean
        const voicesWithSavedStatus = voices.map(voice => ({
            ...voice,
            // Convert count to boolean - if count > 0, then it's saved
            isSaved: session ? (voice._count?.savedBy || 0) > 0 : false,
            // Remove the _count field from the response
            _count: undefined
        }));

        // Convert gs:// URLs to signed URLs
        const voicesWithSignedUrls = await Promise.all(
            voicesWithSavedStatus.map(async (voice) => {
                let audioSample = voice.audioSample;

                if (audioSample?.startsWith('gs://')) {
                    try {
                        console.log('Original audioSample:', audioSample);
                        audioSample = await storageService.getSignedUrl(audioSample, 3600);
                        console.log('Generated signed URL:', audioSample);
                    } catch (error) {
                        console.error('Error generating signed URL for voice audio:', error);
                        console.error('Error details:', error);
                    }
                }

                return {
                    ...voice,
                    audioSample
                };
            })
        );

        return NextResponse.json(voicesWithSignedUrls);
    } catch (error) {
        console.error('Error fetching voices:', error);
        return NextResponse.json(
            { message: 'Failed to fetch voices' },
            { status: 500 }
        );
    }
}

// POST - Create new voice (unchanged)
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const {
            name,
            description = '',
            isPublic = false,
            audioSample,
            duration,
            genreId,
            gender
        } = body;

        if (!name || !audioSample) {
            return NextResponse.json(
                { message: 'Name and audio sample are required' },
                { status: 400 }
            );
        }

        const voice = await prisma.voice.create({
            data: {
                name,
                description,
                isPublic,
                audioSample,
                duration,
                gender: gender || null,
                genreId: genreId || null,
                userId: session.user.id
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

        return NextResponse.json(voice, { status: 201 });
    } catch (error) {
        console.error('Error creating voice:', error);
        return NextResponse.json(
            { message: 'Failed to create voice' },
            { status: 500 }
        );
    }
}