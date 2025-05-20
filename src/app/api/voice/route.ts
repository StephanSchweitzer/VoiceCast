import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
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
        const name = formData.get('name') as string;
        const description = formData.get('description') as string || '';
        const isPublic = formData.get('isPublic') === 'true';
        const audioFile = formData.get('audioFile') as File;

        if (!name || !audioFile) {
            return NextResponse.json(
                { message: 'Name and audio file are required' },
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

        // Save the file
        const bytes = await audioFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create a unique filename
        const ext = audioFile.name.split('.').pop();
        const filename = `${randomUUID()}.${ext}`;
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        const filepath = join(uploadDir, filename);

        // Ensure the directory exists
        await ensureDir(uploadDir);

        // Write the file to disk
        await writeFile(filepath, buffer);

        // Store the voice in the database
        const voice = await prisma.voice.create({
            data: {
                name,
                description,
                isPublic,
                audioSample: `/uploads/${filename}`,
                userId: session.user.id
            }
        });

        return NextResponse.json(voice);
    } catch (error) {
        console.error('Error creating voice:', error);
        return NextResponse.json(
            { message: 'Failed to create voice' },
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
