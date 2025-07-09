import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function SpeakSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Voice Selection Skeleton */}
            <Card>
                <CardHeader className="pb-4">
                    <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                </CardContent>
            </Card>

            {/* Text Input Skeleton */}
            <Card>
                <CardHeader>
                    <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 w-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Generated Audio Skeleton */}
            <div className="space-y-4">
                <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardContent className="p-4">
                            <div className="space-y-3">
                                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}