import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
    return (
        <div className="flex flex-1 flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900">
                        Welcome to Voicecast
                    </h1>
                    <p className="mt-3 text-lg text-gray-600">
                        Create remarkably natural text-to-speech voices that sound just like you or someone else.
                    </p>
                </div>

                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Link href="/voice/new" className="group rounded-lg border border-gray-300 px-5 py-4 transition-colors hover:border-blue-600 hover:bg-gray-100">
                        <h2 className="mb-3 text-xl font-semibold text-blue-600">
                            Create New Voice
                        </h2>
                        <p className="text-sm text-gray-600">
                            Upload a short audio sample and train a unique voice clone in minutes.
                        </p>
                    </Link>
                    <Link href="/voice" className="group rounded-lg border border-gray-300 px-5 py-4 transition-colors hover:border-blue-600 hover:bg-gray-100">
                        <h2 className="mb-3 text-xl font-semibold text-blue-600">
                            Select Existing Voice
                        </h2>
                        <p className="text-sm text-gray-600">
                            Choose from your previously created voice clones to start a new conversation.
                        </p>
                    </Link>
                    <Link href="/voice/community" className="col-span-1 sm:col-span-2 group rounded-lg border border-gray-300 px-5 py-4 transition-colors hover:border-blue-600 hover:bg-gray-100">
                        <h2 className="mb-3 text-xl font-semibold text-blue-600">
                            Community Voices
                        </h2>
                        <p className="text-sm text-gray-600">
                            Browse and use publicly shared voices created by the Voicecast community.
                        </p>
                    </Link>
                </div>
            </div>
        </div>
    );
}