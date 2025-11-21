'use client';

import { useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export function PrintInvoiceRedirectClient() {
    const searchParams = useSearchParams();
    const params = useParams();
    const router = useRouter();

    useEffect(() => {
        const id = searchParams.get('id') || params?.id;
        if (id) {
            router.replace(`/dashboard/invoices/print?id=${id}`);
        }
    }, [router, params?.id, searchParams]);

    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
}
