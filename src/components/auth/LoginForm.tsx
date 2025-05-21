'use client';

import { useState, FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

interface LoginFormProps {
    onSuccess?: () => void;
    redirectUrl?: string;
    showRegisterLink?: boolean;
}

export default function LoginForm({
                                      onSuccess,
                                      redirectUrl = '/dashboard',
                                      showRegisterLink = true
                                  }: LoginFormProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await signIn('credentials', {
                redirect: false,
                email,
                password,
            });

            if (result?.error) {
                setError('Invalid email or password');
                setLoading(false);
                return;
            }

            if (onSuccess) {
                onSuccess();
            } else if (redirectUrl) {
                window.location.href = redirectUrl;
            }
        } catch (error) {
            setError('Something went wrong');
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-sm mx-auto">
            {error && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4 mb-4">
                    <div className="text-sm text-red-700 dark:text-red-400">{error}</div>
                </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">
                        Email address
                    </label>
                    <div className="mt-2">
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:focus:ring-blue-500 dark:bg-gray-800 sm:text-sm sm:leading-6"
                        />
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between">
                        <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">
                            Password
                        </label>
                    </div>
                    <div className="mt-2">
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:focus:ring-blue-500 dark:bg-gray-800 sm:text-sm sm:leading-6"
                        />
                    </div>
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-700 dark:hover:bg-blue-600"
                    >
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </div>
            </form>

            {showRegisterLink && (
                <p className="mt-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    Not a member?{' '}
                    <Link href="/register" className="font-semibold leading-6 text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                        Create an account
                    </Link>
                </p>
            )}
        </div>
    );
}