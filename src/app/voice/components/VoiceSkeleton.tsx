import { Card, CardContent } from '@/components/ui/card';

export default function VoiceSkeleton() {
    return (
        <Card className="animate-pulse">
            <CardContent className="p-4">
                <div className="space-y-3">
                    {/* Voice name and duration */}
                    <div className="flex items-start justify-between">
                        <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>

                    {/* Creator */}
                    <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>

                    {/* Description */}
                    <div className="space-y-2">
                        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>

                    {/* Badges */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                            <div className="h-5 w-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="h-5 w-14 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                            <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                    </div>

                    {/* Bottom section */}
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                        <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}