import { Card, CardContent } from '@/components/ui/card';

export default function SessionSkeleton() {
    return (
        <Card className="animate-pulse">
            <CardContent className="p-4">
                <div className="space-y-3">
                    {/* Session name */}
                    <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>

                    {/* Latest audio text */}
                    <div className="space-y-2">
                        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>

                    {/* Voice and emotion */}
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-5 w-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-4">
                        <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}