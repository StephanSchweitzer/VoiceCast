import { Card, CardContent } from '@/components/ui/card';

export default function SpeakSkeleton() {
    return (
        <div className="h-[calc(100vh-120px)] flex flex-col space-y-2 animate-pulse">
            {/* Session Header Skeleton - Minimal */}
            <div className="px-3 py-1 bg-gray-50 dark:bg-gray-900 rounded text-center">
                <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div>
            </div>

            {/* Voice Selection Skeleton - Compact (matches actual VoiceSelection structure) */}
            <div className="flex-shrink-0">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-2 gap-3">
                        {/* User Voices */}
                        <div className="space-y-2">
                            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="h-9 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded shadow-sm"></div>
                        </div>
                        {/* Saved Voices */}
                        <div className="space-y-2">
                            <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="h-9 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded shadow-sm"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Generated Audio List Skeleton - MAXIMIZED main section */}
            <div className="flex-1 min-h-0 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="h-full flex flex-col">
                    <div className="flex-1 overflow-y-auto space-y-3 p-4">
                        {/* Empty container - audio cards will appear here */}
                    </div>
                </div>
            </div>

            {/* Text Input Skeleton - Compact at bottom (matches actual TextInput structure) */}
            <div className="flex-shrink-0">
                <Card>
                    <CardContent className="space-y-4">
                        {/* Emotion Selection */}
                        <div className="space-y-3">
                            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                ))}
                            </div>
                        </div>
                        {/* Text Area */}
                        <div className="space-y-2">
                            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="flex justify-between items-center">
                                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            </div>
                        </div>
                        {/* Generate Button */}
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}