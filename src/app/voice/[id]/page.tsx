import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import VoiceViewClient from './VoiceViewClient';

interface VoicePageProps {
    params: Promise<{ id: string }>
}

export default async function VoicePage({ params }: VoicePageProps) {
    const id = (await params).id;
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    // Page renders immediately, client handles the rest
    return <VoiceViewClient voiceId={id} userId={session.user.id} />;
}