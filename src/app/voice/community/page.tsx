import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import CommunityVoicesClient from '@/components/voice/CommunityVoicesClient';

export default async function CommunityVoicesPage() {
    // Server-side session handling
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/auth/login');
    }

    // Fetch public voices WITH genre relation
    const publicVoices = await prisma.voice.findMany({
        where: {
            isPublic: true
        },
        include: {
            genre: true, // ✅ Add this line to include the genre relation
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

    return <CommunityVoicesClient initialVoices={publicVoices} />;
}