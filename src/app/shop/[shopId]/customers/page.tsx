/**
 * Customers Page - Server Component
 * Fetches and aggregates customer data server-side
 */

import { Suspense } from 'react';
import { createClient } from '@/supabase/server';
import { CustomersClient } from './client';
import { Skeleton } from '@/components/ui/skeleton';

type CustomerStats = {
    totalPurchase: number;
    invoiceCount: number;
    lastPurchase: string;
};

import { MobileCustomerList } from '@/components/mobile/mobile-customer-list';

// Loading component for Suspense boundary
function CustomersLoading() {
    return (
        <div className="space-y-6 p-6 pb-24 md:pb-6 max-w-[1800px] mx-auto">
            <Skeleton className="h-48 w-full rounded-xl border border-border shadow-sm" />
            <Skeleton className="h-96 w-full rounded-xl border border-border shadow-sm" />
        </div>
    );
}

export default async function CustomersPage({
    params,
}: {
    params: Promise<{ shopId: string }>;
}) {
    const { shopId } = await params;
    const supabase = await createClient();

    // ✅ Server-side data fetching
    const { data } = await supabase
        .from('invoices')
        .select('id, invoice_number, invoice_date, customer_snapshot, grand_total, status')
        .eq('shop_id', shopId);

    // ✅ Server-side aggregation of customer stats
    const customerData: Record<string, CustomerStats> = {};

    for (const invoice of data || []) {
        const customerName = invoice.customer_snapshot?.name || 'Unknown';
        const grandTotal = Number(invoice.grand_total) || 0;
        const invoiceDate = invoice.invoice_date;

        if (!customerData[customerName]) {
            customerData[customerName] = {
                totalPurchase: 0,
                invoiceCount: 0,
                lastPurchase: invoiceDate,
            };
        }

        customerData[customerName].totalPurchase += grandTotal;
        customerData[customerName].invoiceCount++;

        if (new Date(invoiceDate) > new Date(customerData[customerName].lastPurchase)) {
            customerData[customerName].lastPurchase = invoiceDate;
        }
    }

    return (
        <Suspense fallback={<CustomersLoading />}>
            <MobileCustomerList shopId={shopId} customerData={customerData} />
            <div className="hidden md:block">
                <CustomersClient customerData={customerData} shopId={shopId} />
            </div>
        </Suspense>
    );
}
