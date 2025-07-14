import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { randomUUID } from 'crypto';
import { storageService } from '@/lib/storage'; // Import your storage utility

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const audioFile = formData.get('audio') as File;
        const duration = formData.get('duration');

        if (!audioFile) {
            return NextResponse.json(
                { message: 'Audio file is required' },
                { status: 400 }
            );
        }

        if (!audioFile.type.includes('audio/')) {
            return NextResponse.json(
                { message: 'File must be an audio file' },
                { status: 400 }
            );
        }

        const maxSize = 10 * 1024 * 1024; // 10MB
        if (audioFile.size > maxSize) {
            return NextResponse.json(
                { message: 'File size must be less than 10MB' },
                { status: 400 }
            );
        }

        const bytes = await audioFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const ext = audioFile.name.split('.').pop() || 'wav';
        const filename = `${randomUUID()}.${ext}`;

        const filePath = await storageService.uploadReferenceAudio(buffer, filename);

        const response: any = {
            url: filePath,
            filename: filename
        };

        if (duration) {
            response.duration = parseFloat(duration as string);
        }

        return NextResponse.json(response, { status: 201 });
    } catch (error) {
        console.error('Error uploading audio:', error);
        return NextResponse.json(
            { message: 'Failed to upload audio' },
            { status: 500 }
        );
    }
}