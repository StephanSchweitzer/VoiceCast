import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import VoicePlayer from '@/components/voice/VoicePlayer';
import DeleteVoiceButton from '@/components/voice/DeleteVoiceButton';
import { VoiceWithUser } from '@/types/voice';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface VoicePageProps {
    params: Promise<{ id: string }>
}

export default async function VoicePage({ params }: VoicePageProps) {
    const id = (await params).id;
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    const voice = await prisma.voice.findUnique({
        where: { id },
        include: {
            user: {
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

    // Check if the user has access to this voice
    const isOwner = voice.userId === session.user.id;
    if (!voice.isPublic && !isOwner) {
        redirect('/dashboard');
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 md:px-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{voice.name}</h1>

                {isOwner && (
                    <div className="flex space-x-2">
                        <Button
                            variant="outline"
                            asChild
                        >
                            <Link href={`/voice/${id}/edit`}>
                                Edit
                            </Link>
                        </Button>
                        <DeleteVoiceButton voiceId={id} />
                    </div>
                )}
            </div>

            {voice.description && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{voice.description}</p>
            )}

            <div className="mt-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Voice Sample</h2>
                <div className="mt-2">
                    <VoicePlayer audioUrl={voice.audioSample} />
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Text-to-Speech</h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Type or paste text below to convert it to speech using this voice.
                </p>
                <div className="mt-4">
                    <Textarea
                        rows={4}
                        placeholder="Enter text to convert to speech..."
                        className="resize-none"
                    />
                    <div className="mt-2 flex justify-end">
                        <Button>
                            Generate Speech
                        </Button>
                    </div>
                </div>
            </div>

            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-8">
                <div className="flex items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Created by {voice.user.name || 'Anonymous'}
                    </span>
                    <span className="mx-2 text-gray-500 dark:text-gray-400">•</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {voice.isPublic ? 'Public' : 'Private'} voice
                    </span>
                </div>
            </div>
        </div>
    );
}