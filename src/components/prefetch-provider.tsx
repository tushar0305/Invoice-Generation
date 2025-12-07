'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useInvalidateQueries } from '@/hooks/use-cached-data';

interface PrefetchProviderProps {
    shopId: string | undefined;
    children: React.ReactNode;
}

/**
 * Provider that prefetches data when navigating to commonly accessed pages
 * This improves perceived performance by having data ready before the user needs it
 */
export function PrefetchProvider({ shopId, children }: PrefetchProviderProps) {
    const pathname = usePathname();
    const { prefetchInvoices, prefetchStock } = useInvalidateQueries();

    useEffect(() => {
        if (!shopId) return;

        // Prefetch data based on current route
        // When on dashboard, prefetch invoices and stock for quick navigation
        if (pathname?.includes('/dashboard')) {
            // Delay prefetching to not block initial render
            const timer = setTimeout(() => {
                prefetchInvoices(shopId);
                prefetchStock(shopId);
            }, 1000);
            return () => clearTimeout(timer);
        }

        // When on invoices page, prefetch stock (likely to create new invoice)
        if (pathname?.includes('/invoices')) {
            const timer = setTimeout(() => {
                prefetchStock(shopId);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [pathname, shopId, prefetchInvoices, prefetchStock]);

    return <>{children}</>;
}
