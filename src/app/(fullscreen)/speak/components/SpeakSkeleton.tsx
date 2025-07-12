import { Card, CardContent } from '@/components/ui/card';

export default function SpeakSkeleton() {
    return (
        <div className="h-[calc(100vh-72px)] flex flex-col animate-pulse">
            {/* Hidden audio element for auto-play (matches SpeakClient) */}
            <audio preload="none" />

            {/* Session Header - Matches SpeakClient padding */}
            <div className="px-5 py-1 rounded text-center flex-shrink-0">
                <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div>
            </div>

            {/* Voice Selection - Matches SpeakClient spacing */}
            <div className="flex-shrink-0 mt-2">
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

            {/* Generated Audio List - Matches SpeakClient structure exactly */}
            <div className="flex-1 min-h-0 rounded-lg overflow-hidden mt-2">
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                    {/* Placeholder content matching the "new conversation" state */}
                    <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                    <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-4 w-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>

            {/* Text Input - Matches SpeakClient spacing */}
            <div className="flex-shrink-0 mt-2">
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