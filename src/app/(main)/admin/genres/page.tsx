import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { isUserAdmin } from '@/lib/utils/admin';
import GenreManager from '@/components/admin/GenreManager';

export default async function AdminGenresPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    if (!isUserAdmin(session)) {
        redirect('/unauthorized');
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <GenreManager />
        </div>
    );
}