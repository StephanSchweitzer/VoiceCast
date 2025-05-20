import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import VoicePlayer from '@/components/voice/VoicePlayer';
import DeleteVoiceButton from '@/components/voice/DeleteVoiceButton';
import { VoiceWithUser } from '@/types/voice';

interface VoicePageProps {
    params: {
        id: string;
    };
}

export default async function VoicePage({ params }: VoicePageProps) {
    const { id } = params;
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
                <h1 className="text-2xl font-bold text-gray-900">{voice.name}</h1>

                {isOwner && (
                    <div className="flex space-x-2">
                        <Link
                            href={`/voice/${id}/edit`}
                            className="rounded-md bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                            Edit
                        </Link>
                        <DeleteVoiceButton voiceId={id} />
                    </div>
                )}
            </div>

            {voice.description && (
                <p className="mt-2 text-sm text-gray-600">{voice.description}</p>
            )}

            <div className="mt-6">
                <h2 className="text-lg font-medium text-gray-900">Voice Sample</h2>
                <div className="mt-2">
                    <VoicePlayer audioUrl={voice.audioSample} />
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900">Text-to-Speech</h2>
                <p className="mt-2 text-sm text-gray-600">
                    Type or paste text below to convert it to speech using this voice.
                </p>
                <div className="mt-4">
          <textarea
              rows={4}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Enter text to convert to speech..."
          />
                    <div className="mt-2 flex justify-end">
                        <button
                            type="button"
                            className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Generate Speech
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-8 border-t border-gray-200 pt-8">
                <div className="flex items-center">
          <span className="text-sm text-gray-500">
            Created by {voice.user.name || 'Anonymous'}
          </span>
                    <span className="mx-2 text-gray-500">•</span>
                    <span className="text-sm text-gray-500">
            {voice.isPublic ? 'Public' : 'Private'} voice
          </span>
                </div>
            </div>
        </div>
    );
}