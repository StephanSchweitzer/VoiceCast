import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface ErrorStateProps {
    message: string;
    onRetry: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
    return (
        <Card className="border-red-200 dark:border-red-800">
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Something went wrong
                    </h3>
                    <p className="text-sm text-red-600 dark:text-red-400 mb-4 max-w-md">
                        {message}
                    </p>
                    <Button onClick={onRetry} variant="outline">
                        Try Again
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}