import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const voiceId = (await params).id;
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Find and delete the saved voice
        const deletedSave = await prisma.savedVoice.deleteMany({
            where: {
                userId: session.user.id,
                voiceId: voiceId
            }
        });

        if (deletedSave.count === 0) {
            return NextResponse.json(
                { message: 'Saved voice not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ message: 'Voice unsaved successfully' });
    } catch (error) {
        console.error('Error unsaving voice:', error);
        return NextResponse.json(
            { message: 'Failed to unsave voice' },
            { status: 500 }
        );
    }
}