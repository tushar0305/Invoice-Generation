import { Suspense } from 'react';
import { PaymentResultClient } from './client';
import { Loader2 } from 'lucide-react';

export default async function PaymentResultPage({ params }: { params: Promise<{ shopId: string }> }) {
    const { shopId } = await params;

    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
        }>
            <PaymentResultClient shopId={shopId} />
        </Suspense>
    );
}
