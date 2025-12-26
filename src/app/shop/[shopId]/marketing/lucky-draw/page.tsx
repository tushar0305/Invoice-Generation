import { Suspense } from 'react';
import { getDrawHistory } from '@/actions/lucky-draw-actions';
import { LuckyDrawClient } from './client';
import { Skeleton } from '@/components/ui/skeleton';

export default async function LuckyDrawPage({ params }: { params: Promise<{ shopId: string }> }) {
    const { shopId } = await params;
    const history = await getDrawHistory(shopId);

    return (
        <div className="container mx-auto py-6 max-w-5xl">
            <Suspense fallback={<LuckyDrawSkeleton />}>
                <LuckyDrawClient initialHistory={history || []} />
            </Suspense>
        </div>
    );
}

function LuckyDrawSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
                <Skeleton className="h-[400px] md:col-span-1" />
                <Skeleton className="h-[400px] md:col-span-2" />
            </div>
        </div>
    );
}
