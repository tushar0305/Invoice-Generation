/**
 * Customers Page - Server Component
 * Fetches and aggregates customer data server-side
 */

import { Suspense } from 'react';
import { createClient } from '@/supabase/server';
import { CustomersClient } from './client';
import { Loader2 } from 'lucide-react';

type CustomerStats = {
    totalPurchase: number;
    invoiceCount: number;
    lastPurchase: string;
};

// Loading component for Suspense boundary
function CustomersLoading() {
    return (
        <div className="flex h-[50vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
        .select('id, invoice_number, invoice_date, customer_name, grand_total, status')
        .eq('shop_id', shopId);

    // ✅ Server-side aggregation of customer stats
    const customerData: Record<string, CustomerStats> = {};

    for (const invoice of data || []) {
        const customerName = invoice.customer_name;
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
            <CustomersClient customerData={customerData} shopId={shopId} />
        </Suspense>
    );
}
