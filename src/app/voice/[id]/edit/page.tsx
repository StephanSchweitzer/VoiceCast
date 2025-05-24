import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import VoiceEditClient from './VoiceEditClient';

interface VoiceEditPageProps {
    params: Promise<{ id: string }>
}

export default async function VoiceEditPage({ params }: VoiceEditPageProps) {
    const id = (await params).id;
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/auth/login');
    }

    // Page renders immediately, client handles the rest
    return <VoiceEditClient voiceId={id} />;
}