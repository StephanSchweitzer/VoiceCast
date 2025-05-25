import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import CommunityVoicesClient from '@/components/voice/CommunityVoicesClient';

export default async function CommunityVoicesPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/auth/login');
    }

    // Fetch public voices WITH genre relation
    const publicVoicesRaw = await prisma.voice.findMany({
        where: {
            isPublic: true
        },
        include: {
            genre: true,
            user: {
                select: {
                    name: true,
                    image: true
                }
            }
        },
        orderBy: {
            updatedAt: 'desc'
        }
    });

    const publicVoices = JSON.parse(JSON.stringify(publicVoicesRaw));

    return <CommunityVoicesClient initialVoices={publicVoices} />;
}