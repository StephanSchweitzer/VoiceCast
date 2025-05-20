'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function CreateVoice() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [isPublic, setIsPublic] = useState(false);
    const [audioPreview, setAudioPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');

    // Redirect if not authenticated
    if (status === 'unauthenticated') {
        router.push('/login');
        return null;
    }

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type.includes('audio/')) {
            setAudioFile(file);
            // Create preview URL
            const url = URL.createObjectURL(file);
            setAudioPreview(url);
        } else {
            setError('Please upload an audio file');
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!audioFile) {
            setError('Please upload an audio sample');
            return;
        }

        setIsUploading(true);
        setError('');

        try {
            // Create a FormData instance
            const formData = new FormData();
            formData.append('name', name);
            formData.append('description', description);
            formData.append('isPublic', String(isPublic));
            formData.append('audioFile', audioFile);

            // Send the request to the API
            const response = await fetch('/api/voice', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to create voice');
            }

            const data = await response.json();
            router.push(`/voice/${data.id}`);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An unknown error occurred');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 md:px-8">
            <h1 className="text-2xl font-bold text-gray-900">Create New Voice</h1>
            <p className="mt-2 text-sm text-gray-600">
                Upload a short audio sample (minimum 10 seconds) of your voice or any voice you want to clone.
                For best results, use a clear recording with minimal background noise.
            </p>

            {error && (
                <div className="mt-4 rounded-md bg-red-50 p-4">
                    <div className="text-sm text-red-700">{error}</div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Voice Name
                    </label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description (optional)
                    </label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Audio Sample</label>
                    <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pt-5 pb-6">
                        <div className="space-y-1 text-center">
                            <svg
                                className="mx-auto h-12 w-12 text-gray-400"
                                stroke="currentColor"
                                fill="none"
                                viewBox="0 0 48 48"
                                aria-hidden="true"
                            >
                                <path
                                    d="M24 10.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5zM10.75 24a13.25 13.25 0 1 1 26.5 0 13.25 13.25 0 0 1-26.5 0z"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M14.92 35.4l-1.75 7a.5.5 0 0 0 .61.61l7-1.75a.5.5 0 0 0 .3-.3l1.75-7a.5.5 0 0 0-.61-.61l-7 1.75a.5.5 0 0 0-.3.3z"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            <div className="flex justify-center text-sm text-gray-600">
                                <label
                                    htmlFor="file-upload"
                                    className="relative cursor-pointer rounded-md bg-white font-medium text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 hover:text-blue-500"
                                >
                                    <span>Upload a file</span>
                                    <input
                                        id="file-upload"
                                        name="file-upload"
                                        type="file"
                                        className="sr-only"
                                        accept="audio/*"
                                        onChange={handleFileChange}
                                    />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">MP3, WAV, M4A up to 10MB</p>
                        </div>
                    </div>
                </div>

                {audioPreview && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Preview</label>
                        <audio
                            controls
                            src={audioPreview}
                            className="mt-1 w-full"
                        />
                    </div>
                )}

                <div className="flex items-start">
                    <div className="flex h-5 items-center">
                        <input
                            id="isPublic"
                            name="isPublic"
                            type="checkbox"
                            checked={isPublic}
                            onChange={(e) => setIsPublic(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                    </div>
                    <div className="ml-3 text-sm">
                        <label htmlFor="isPublic" className="font-medium text-gray-700">
                            Make this voice public
                        </label>
                        <p className="text-gray-500">
                            Allow other users to find and use this voice in the community section.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isUploading || !audioFile}
                        className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isUploading ? 'Creating...' : 'Create Voice'}
                    </button>
                </div>
            </form>
        </div>
    );
}