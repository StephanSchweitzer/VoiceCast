import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { unlink } from 'fs/promises';
import { join } from 'path';

// PATCH - Update voice audio sample
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
        const body = await request.json();
        const { audioSample, duration } = body; // ADD: Accept duration along with audioSample

        if (!audioSample) {
            return NextResponse.json(
                { message: 'Audio sample URL is required' },
                { status: 400 }
            );
        }

        const voice = await prisma.voice.findUnique({
            where: { id }
        });

        if (!voice) {
            return NextResponse.json({ message: 'Voice not found' }, { status: 404 });
        }

        // Check if the user owns this voice
        if (voice.userId !== session.user.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
        }

        // Store old audio sample path for cleanup
        const oldAudioSample = voice.audioSample;

        // Update the voice with new audio sample and duration
        const updatedVoice = await prisma.voice.update({
            where: { id },
            data: {
                audioSample,
                ...(duration !== undefined && { duration }) // ADD: Update duration if provided
            },
            select: {
                id: true,
                name: true,
                description: true,
                isPublic: true,
                audioSample: true,
                duration: true, // ADD: Include duration in response
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

        // Clean up old audio file if it was a local upload
        if (oldAudioSample && oldAudioSample.startsWith('/uploads/') && oldAudioSample !== audioSample) {
            try {
                const filename = oldAudioSample.replace('/uploads/', '');
                const filepath = join(process.cwd(), 'public', 'uploads', filename);
                await unlink(filepath);
            } catch (fileError) {
                console.warn('Could not delete old audio file:', fileError);
                // Continue anyway - the new audio sample is updated
            }
        }

        return NextResponse.json(updatedVoice);
    } catch (error) {
        console.error('Error updating voice audio:', error);
        return NextResponse.json(
            { message: 'Failed to update voice audio' },
            { status: 500 }
        );
    }
}