import Link from 'next/link';

export default function Home() {
    return (
        <div className="flex flex-1 flex-col items-center justify-center px-4">
            <div className="w-full max-w-2xl space-y-8">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-4">
                        Welcome to Voicecast
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300 max-w-lg mx-auto">
                        Clone any voice with AI, then choose the exact emotion you want it to express.
                    </p>
                </div>

                {/* Primary Action - Speak */}
                <div className="mt-12">
                    <Link
                        href="/speak"
                        className="group relative block w-full overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-center shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-blue-500/50"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-purple-600/90 transition-opacity group-hover:opacity-75"></div>
                        <div className="relative">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Start Speaking</h2>
                            <p className="text-lg text-white/90">
                                Choose from your voices or community voices and generate speech with any emotion instantly.
                            </p>
                        </div>
                    </Link>
                </div>

                {/* Secondary Actions */}
                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Link
                        href="/voice/new"
                        className="group rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:border-blue-600 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-lg"
                    >
                        <div className="flex items-center mb-3">
                            <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                                <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                Create New Voice
                            </h2>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Upload an audio sample and create your AI voice clone in seconds.
                        </p>
                    </Link>

                    <Link
                        href="/voice/community"
                        className="group rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:border-blue-600 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-lg"
                    >
                        <div className="flex items-center mb-3">
                            <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                                <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                Community Voices
                            </h2>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Discover and use voices shared by the Voicecast community.
                        </p>
                    </Link>
                </div>

            </div>
        </div>
    );
}