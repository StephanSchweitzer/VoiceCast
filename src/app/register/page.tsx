'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RegistrationForm } from '@/components/auth/RegistrationForm';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner'; // Add if you want toast notifications

export default function RegisterPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleRegistration = async (userData: {
        name: string;
        email: string;
        password: string;
        confirmPassword: string;
    }) => {
        // Reset states
        setError(null);
        setIsLoading(true);

        try {
            // Validate passwords match
            if (userData.password !== userData.confirmPassword) {
                throw new Error('Passwords do not match');
            }

            // Call the registration API
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: userData.name,
                    email: userData.email,
                    password: userData.password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to register');
            }

            // Registration successful
            setSuccess(true);

            // Optional: Add toast notification
            // toast.success("Account created successfully!");

            // Redirect to login after a short delay
            setTimeout(() => {
                router.push('/login');
            }, 2000);

        } catch (error) {
            setError(error instanceof Error ? error.message : 'An error occurred during registration');

            // Optional: Add toast notification
            // toast.error(error instanceof Error ? error.message : 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900 dark:text-white">
                    Create your account
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                    Already have an account?{' '}
                    <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                        Sign in
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white dark:bg-gray-800 px-6 py-8 shadow sm:rounded-lg sm:px-8">
                    {success ? (
                        <div className="rounded-md bg-green-50 dark:bg-green-900 p-4 mb-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                        Registration successful! Redirecting to login...
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 flex justify-center">
                                <Spinner />
                            </div>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="rounded-md bg-red-50 dark:bg-red-900/50 p-4 mb-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-red-800 dark:text-red-200">
                                                {error}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <RegistrationForm onSubmit={handleRegistration} isLoading={isLoading} />

                            <div className="mt-6">
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
                                          By registering, you agree to our terms
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}