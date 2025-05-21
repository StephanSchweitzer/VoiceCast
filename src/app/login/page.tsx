'use client';

import { useRouter } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';

export default function Login() {
    const router = useRouter();

    const handleSuccess = () => {
        router.push('/dashboard');
    };

    return (
        <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900 dark:text-white">
                    Sign in to your account
                </h2>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                <LoginForm onSuccess={handleSuccess} />
            </div>
        </div>
    );
}