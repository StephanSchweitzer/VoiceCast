import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { isUserAdmin } from '@/lib/utils/admin';

export default async function AdminLayout({
                                              children,
                                          }: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    if (!isUserAdmin(session)) {
        redirect('/unauthorized');
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                                AAC Admin Panel
                            </h1>
                        </div>
                    </div>
                </div>
            </div>
            <main>{children}</main>
        </div>
    );
}