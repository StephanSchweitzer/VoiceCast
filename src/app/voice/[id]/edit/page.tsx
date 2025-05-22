import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { VoiceWithUser } from '@/types/voice';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import VoiceEditForm from '@/components/voice/VoiceEditForm';

interface VoiceEditPageProps {
    params: Promise<{ id: string }>
}

export default async function VoiceEditPage({ params }: VoiceEditPageProps) {
    const id = (await params).id;
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    // Fetch available genres
    const genres = await prisma.genre.findMany({
        orderBy: { name: 'asc' }
    });

    const voice = await prisma.voice.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    name: true
                }
            },
            genre: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    }) as VoiceWithUser | null;

    if (!voice) {
        redirect('/dashboard');
    }

    // Check if the user owns this voice
    const isOwner = voice.userId === session.user.id;
    if (!isOwner) {
        redirect('/dashboard');
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 md:px-8">
            <div className="mb-6">
                <Button
                    variant="ghost"
                    asChild
                    className="mb-4"
                >
                    <Link href={`/voice/${id}`} className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Voice
                    </Link>
                </Button>

                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Edit Voice: {voice.name}
                </h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Modify your voice settings and audio sample. Changes will affect all future generations.
                </p>
            </div>

            <VoiceEditForm voice={voice} genres={genres} />
        </div>
    );
}