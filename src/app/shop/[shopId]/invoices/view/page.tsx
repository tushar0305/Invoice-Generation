import { ViewInvoiceClient } from './client';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';



function ViewInvoiceLoading() {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
}

export default function ViewInvoicePage() {
    return (
        <Suspense fallback={<ViewInvoiceLoading />}>
            <ViewInvoiceClient />
        </Suspense>
    );
}
