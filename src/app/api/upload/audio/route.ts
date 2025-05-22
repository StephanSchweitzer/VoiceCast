import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const audioFile = formData.get('audio') as File;
        const duration = formData.get('duration'); // ADD: Extract duration from FormData

        if (!audioFile) {
            return NextResponse.json(
                { message: 'Audio file is required' },
                { status: 400 }
            );
        }

        // Check if the file is an audio file
        if (!audioFile.type.includes('audio/')) {
            return NextResponse.json(
                { message: 'File must be an audio file' },
                { status: 400 }
            );
        }

        // Check file size (10MB limit)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (audioFile.size > maxSize) {
            return NextResponse.json(
                { message: 'File size must be less than 10MB' },
                { status: 400 }
            );
        }

        // Save the file
        const bytes = await audioFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create a unique filename
        const ext = audioFile.name.split('.').pop() || 'wav';
        const filename = `${randomUUID()}.${ext}`;
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        const filepath = join(uploadDir, filename);

        // Ensure the directory exists
        await ensureDir(uploadDir);

        // Write the file to disk
        await writeFile(filepath, buffer);

        // UPDATED: Build response object with optional duration
        const response: any = {
            url: `/uploads/${filename}`,
            filename: filename
        };

        // ADD: Include duration in response if provided (for recordings)
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

async function ensureDir(dirPath: string) {
    try {
        await fs.access(dirPath);
    } catch (error) {
        await fs.mkdir(dirPath, { recursive: true });
    }
}