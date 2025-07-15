import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { storageService} from "@/lib/storage";
import { GoogleAuth } from 'google-auth-library';

const EMOTION_MAPPINGS = {
    neutral: { arousal: 0.5, valence: 0.5 },
    happy: { arousal: 0.8, valence: 0.8 },
    sad: { arousal: 0.3, valence: 0.2 },
    angry: { arousal: 0.9, valence: 0.1 },
    fearful: { arousal: 0.8, valence: 0.3 },
    surprised: { arousal: 0.7, valence: 0.6 }
} as const;

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '15');
    const cursor = searchParams.get('cursor');
    const sessionId = searchParams.get('sessionId');

    try {
        const whereClause: { userId: string; sessionId?: string } = {
            userId: session.user.id
        };
        if (sessionId) {
            whereClause.sessionId = sessionId;
        }

        const generatedAudios = await prisma.generatedAudio.findMany({
            where: whereClause,
            include: {
                voice: {
                    select: {
                        id: true,
                        name: true,
                        audioSample: true
                    }
                },
                session: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit + 1,
            ...(cursor && {
                cursor: {
                    id: cursor
                },
                skip: 1
            })
        });

        const hasMore = generatedAudios.length > limit;
        const audios = hasMore ? generatedAudios.slice(0, -1) : generatedAudios;
        const nextCursor = hasMore ? audios[audios.length - 1].id : null;

        const audiosWithUrls = await Promise.all(
            audios.map(async (audio) => {
                let filePath = audio.filePath;
                let voiceAudioSample = audio.voice.audioSample;

                if (filePath?.startsWith('gs://')) {
                    try {
                        console.log('Original filePath:', filePath);
                        filePath = await storageService.getSignedUrl(filePath, 3600);
                        console.log('Generated signed URL:', filePath);
                    } catch (error) {
                        console.error('Error generating signed URL for audio:', error);
                        console.error('Error details:', error);
                    }
                }

                if (voiceAudioSample?.startsWith('gs://')) {
                    try {
                        voiceAudioSample = await storageService.getSignedUrl(voiceAudioSample, 3600);
                    } catch (error) {
                        console.error('Error generating signed URL for voice:', error);
                    }
                }

                return {
                    ...audio,
                    filePath,
                    voice: {
                        ...audio.voice,
                        audioSample: voiceAudioSample
                    }
                };
            })
        );

        return NextResponse.json({
            audios: audiosWithUrls,
            hasMore,
            nextCursor
        });
    } catch (error) {
        console.error('Error fetching generated audio:', error);
        return NextResponse.json(
            { message: 'Failed to fetch generated audio' },
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
        const { text, voiceId, emotion, sessionId } = await request.json();

        if (!text || !voiceId || !emotion || !sessionId) {
            return NextResponse.json(
                { message: 'Text, voice ID, emotion, and session ID are required' },
                { status: 400 }
            );
        }

        if (!(emotion in EMOTION_MAPPINGS)) {
            return NextResponse.json(
                { message: 'Invalid emotion' },
                { status: 400 }
            );
        }

        const speakSession = await prisma.speakSession.findUnique({
            where: { id: sessionId }
        });

        if (!speakSession || speakSession.userId !== session.user.id) {
            return NextResponse.json(
                { message: 'Session not found or access denied' },
                { status: 404 }
            );
        }

        const voice = await prisma.voice.findUnique({
            where: { id: voiceId }
        });

        if (!voice) {
            return NextResponse.json(
                { message: 'Voice not found' },
                { status: 404 }
            );
        }

        const hasAccess = voice.userId === session.user.id ||
            voice.isPublic ||
            await prisma.savedVoice.findUnique({
                where: {
                    userId_voiceId: {
                        userId: session.user.id,
                        voiceId: voiceId
                    }
                }
            });

        if (!hasAccess) {
            return NextResponse.json(
                { message: 'Access denied to this voice' },
                { status: 403 }
            );
        }

        const { arousal, valence } = EMOTION_MAPPINGS[emotion as keyof typeof EMOTION_MAPPINGS];

        const audioBuffer = await storageService.readFile(voice.audioSample);

        const ttsApiUrl = process.env.TTS_API_URL;
        if (!ttsApiUrl) {
            throw new Error('TTS_API_URL environment variable not configured');
        }

        const auth = new GoogleAuth();
        const client = await auth.getIdTokenClient(ttsApiUrl);
        const headers = await client.getRequestHeaders();
        const authHeader = headers.get('Authorization');
        const idToken = authHeader?.replace('Bearer ', '');

        if (!idToken) {
            throw new Error('Failed to get ID token for Cloud Run authentication');
        }

        const formData = new FormData();
        formData.append('text', text);
        formData.append('valence', valence.toString());
        formData.append('arousal', arousal.toString());

        const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' });
        formData.append('reference_audio', audioBlob, 'reference.wav');

        const ttsResponse = await fetch(`${ttsApiUrl}/synthesize`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${idToken}`,
            },
            body: formData
        });

        if (!ttsResponse.ok) {
            const errorText = await ttsResponse.text();
            console.error('TTS API Response:', errorText);
            throw new Error(`TTS API error: ${ttsResponse.status} - ${errorText}`);
        }

        const audioArrayBuffer = await ttsResponse.arrayBuffer();
        const buffer = Buffer.from(audioArrayBuffer);

        const filename = `${Date.now()}_${Math.random().toString(36).substring(2)}.wav`;
        const bucketFilePath = await storageService.uploadGeneratedAudio(buffer, filename);

        const generatedAudio = await prisma.$transaction(async (tx) => {
            const audio = await tx.generatedAudio.create({
                data: {
                    userId: session.user.id,
                    voiceId,
                    sessionId,
                    text,
                    emotion,
                    arousal,
                    valence,
                    filePath: bucketFilePath
                },
                include: {
                    voice: {
                        select: {
                            id: true,
                            name: true,
                            audioSample: true
                        }
                    },
                    session: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            });

            await tx.speakSession.update({
                where: { id: sessionId },
                data: { updatedAt: new Date() }
            });

            return audio;
        });

        let responseFilePath = generatedAudio.filePath;
        if (responseFilePath?.startsWith('gs://')) {
            try {
                responseFilePath = await storageService.getSignedUrl(responseFilePath, 3600);
            } catch (error) {
                console.error('Error generating signed URL for response:', error);
            }
        }

        let voiceAudioSample = generatedAudio.voice.audioSample;
        if (voiceAudioSample?.startsWith('gs://')) {
            try {
                voiceAudioSample = await storageService.getSignedUrl(voiceAudioSample, 3600);
            } catch (error) {
                console.error('Error generating signed URL for voice:', error);
            }
        }

        return NextResponse.json({
            ...generatedAudio,
            filePath: responseFilePath,
            voice: {
                ...generatedAudio.voice,
                audioSample: voiceAudioSample
            }
        }, { status: 201 });
    } catch (error) {
        console.error('Error generating audio:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to generate audio';
        return NextResponse.json(
            { message: errorMessage },
            { status: 500 }
        );
    }
}