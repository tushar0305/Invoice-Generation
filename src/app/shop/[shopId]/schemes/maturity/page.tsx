import { Suspense } from 'react';
import { getMaturityForecast } from '@/actions/scheme-analytics-actions';
import { MaturityForecastClient } from './client';
import { Skeleton } from '@/components/ui/skeleton';

export default async function MaturityForecastPage({ params }: { params: Promise<{ shopId: string }> }) {
    const { shopId } = await params;
    const { forecast, summary } = await getMaturityForecast(shopId);

    return (
        <div className="container mx-auto py-6 max-w-6xl">
            <Suspense fallback={<MaturitySkeleton />}>
                <MaturityForecastClient 
                    forecast={forecast} 
                    summary={summary} 
                    shopId={shopId} 
                />
            </Suspense>
        </div>
    );
}

function MaturitySkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
            </div>
            <div className="grid gap-6 md:grid-cols-3">
                <Skeleton className="h-[300px] md:col-span-2" />
                <Skeleton className="h-[300px]" />
            </div>
            <Skeleton className="h-[400px]" />
        </div>
    );
}
