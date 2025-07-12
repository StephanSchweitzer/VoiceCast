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

    // 🔑 ONLY CHANGE: Add the _count logic and isSaved transformation
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
            },
            // ✅ ADD THIS: Include the _count for savedBy
            _count: {
                select: {
                    savedBy: {
                        where: {
                            userId: session.user.id
                        }
                    }
                }
            }
        },
        orderBy: {
            updatedAt: 'desc'
        }
    });

    // ✅ ADD THIS: Transform to include isSaved boolean
    const publicVoicesWithSavedStatus = publicVoicesRaw.map(voice => ({
        ...voice,
        // Convert count to boolean - if count > 0, then it's saved
        isSaved: (voice._count?.savedBy || 0) > 0,
        // Remove the _count field from the response
        _count: undefined
    }));

    // Same serialization as before
    const publicVoices = JSON.parse(JSON.stringify(publicVoicesWithSavedStatus));

    return <CommunityVoicesClient initialVoices={publicVoices} />;
}