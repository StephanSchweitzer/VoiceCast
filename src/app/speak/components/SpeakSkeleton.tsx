import { Card, CardContent } from '@/components/ui/card';

export default function SpeakSkeleton() {
    return (
        <div className="-mt-4 h-[calc(100vh-120px)] md:h-[calc(100vh-120px)] flex flex-col space-y-1 md:space-y-2 animate-pulse">
            {/* Session Header Skeleton - Minimal */}
            <div className="px-3 py-1 bg-gray-50 dark:bg-gray-900 rounded text-center flex-shrink-0">
                <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div>
            </div>

            {/* Voice Selection Skeleton - Compact (matches new VoiceSelection structure) */}
            <div className="flex-shrink-0">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {/* Collapsed Header - Always Visible (matches actual VoiceSelection) */}
                    <div className="flex items-center justify-between p-3">
                        <div className="flex-1">
                            {/* Selected Voice Info - matches the actual structure */}
                            <div className="flex items-center space-x-2">
                                <div className="flex items-center space-x-1">
                                    <div className="h-3 w-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                </div>
                                <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            </div>
                        </div>
                        {/* Chevron Button */}
                        <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                </div>
            </div>

            {/* Generated Audio List Skeleton - MAXIMIZED main section */}
            <div className="flex-1 min-h-0 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
                <div className="h-full flex flex-col">
                    <div className="flex-1 overflow-y-auto space-y-3 p-4">
                        {/* Empty container - audio cards will appear here */}
                    </div>
                </div>
            </div>

            {/* Text Input Skeleton - Compact at bottom (matches new TextInput structure) */}
            <div className="flex-shrink-0">
                <Card className="p-0">
                    <CardContent className="space-y-2 p-3">
                        {/* Emotion Selection - No label, compact buttons in single row */}
                        <div className="grid grid-cols-6 gap-2">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            ))}
                        </div>

                        {/* Text Area - Compact 2 rows */}
                        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>

                        {/* Bottom Row - Character count and Generate Button side by side */}
                        <div className="flex justify-between items-center gap-3">
                            <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0"></div>
                            <div className="flex-1 h-9 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}