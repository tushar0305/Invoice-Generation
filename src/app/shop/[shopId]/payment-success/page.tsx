import { Suspense } from 'react';
import { PaymentSuccessClient } from './client';

export default async function PaymentSuccessPage({ params }: { params: Promise<{ shopId: string }> }) {
    const { shopId } = await params;

    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
        }>
            <PaymentSuccessClient shopId={shopId} />
        </Suspense>
    );
}
