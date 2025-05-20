import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { VoiceDataLoader } from '@/components/voice/VoiceDataLoader';

export default async function DashboardLayout({
                                                  children,
                                              }: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    const voices = await prisma.voice.findMany({
        where: {
            userId: session.user.id
        },
        orderBy: {
            updatedAt: 'desc'
        }
    });

    return (
        <>
            <VoiceDataLoader voices={voices} />
            {children}
        </>
    );
}