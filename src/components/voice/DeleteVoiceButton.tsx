'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DeleteVoiceButtonProps {
    voiceId: string;
}

export default function DeleteVoiceButton({ voiceId }: DeleteVoiceButtonProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);

        try {
            const response = await fetch(`/api/voice/${voiceId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete voice');
            }

            router.push('/dashboard');
        } catch (error) {
            console.error('Error deleting voice:', error);
            setIsDeleting(false);
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setShowConfirmation(true)}
                className="rounded-md bg-red-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
                Delete
            </button>

            {/* Confirmation Modal */}
            {showConfirmation && (
                <div className="fixed inset-0 z-10 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setShowConfirmation(false)} />
                    <div className="relative rounded-lg bg-white p-4 text-left shadow-xl sm:max-w-lg sm:p-6">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <h3 className="text-lg font-medium leading-6 text-gray-900">Delete Voice</h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">
                                        Are you sure you want to delete this voice? This action cannot be undone.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowConfirmation(false)}
                                className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}