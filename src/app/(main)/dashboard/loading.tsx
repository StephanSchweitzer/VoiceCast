function DashboardLoadingSkeleton() {
    return (
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
                {/* Title Skeleton */}
                <div className="mb-8">
                    <div className="h-9 w-32 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
                </div>

                {/* Start Speaking Card Skeleton */}
                <div className="mb-8">
                    <div className="w-full rounded-2xl bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 p-8 text-center shadow-xl animate-pulse">
                        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm"></div>
                        <div className="h-8 w-40 bg-white/30 rounded mx-auto mb-2"></div>
                        <div className="h-6 w-96 bg-white/20 rounded mx-auto"></div>
                    </div>
                </div>

                {/* Recent Sessions Skeleton */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-7 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, index) => (
                            <div
                                key={index}
                                className="rounded-xl bg-gray-100 dark:bg-gray-700 p-6 text-center animate-pulse"
                            >
                                <div className="mb-3 h-12 w-12 rounded-full bg-gray-300 dark:bg-gray-600 mx-auto"></div>
                                <div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded mx-auto mb-1"></div>
                                <div className="h-3 w-16 bg-gray-300 dark:bg-gray-600 rounded mx-auto mb-1"></div>
                                <div className="h-3 w-14 bg-gray-300 dark:bg-gray-600 rounded mx-auto"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Voice Library Card Skeleton */}
            <div className="mb-6 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 shadow">
                <div className="px-4 py-5 sm:p-6">
                    <div className="sm:flex sm:items-center sm:justify-between mb-4">
                        <div className="h-7 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        <div className="mt-3 sm:mt-0 h-9 w-24 bg-blue-200 dark:bg-blue-700 rounded-md animate-pulse"></div>
                    </div>

                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {[...Array(6)].map((_, index) => (
                            <div
                                key={index}
                                className="rounded-lg bg-white dark:bg-gray-700 p-4 shadow animate-pulse"
                            >
                                <div className="flex items-center space-x-3 mb-3">
                                    <div className="h-10 w-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                                    <div className="flex-1">
                                        <div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded mb-1"></div>
                                        <div className="h-3 w-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-3 w-full bg-gray-300 dark:bg-gray-600 rounded"></div>
                                    <div className="h-3 w-4/5 bg-gray-300 dark:bg-gray-600 rounded"></div>
                                </div>
                                <div className="mt-4 flex justify-between items-center">
                                    <div className="h-6 w-16 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                                    <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Activity Card Skeleton */}
            <div className="overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 shadow">
                <div className="px-4 py-5 sm:p-6">
                    <div className="h-7 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                    <div className="space-y-2">
                        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Loading() {
    return <DashboardLoadingSkeleton />;
}