// ... imports
import { Suspense } from 'react';
import { createClient } from '@/supabase/server';
import { CustomersClient } from './client';
import { Skeleton } from '@/components/ui/skeleton';

type CustomerStats = {
    totalPurchase: number;
    invoiceCount: number;
    lastPurchase: string;
};

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

    // ✅ Server-side data fetching from CUSTOMERS table
    const { data: customers, error } = await supabase
        .from('customers')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

    // ✅ Server-side aggregation of customer stats
    const customerData: Record<string, CustomerStats> = {};

    if (customers) {
        for (const customer of customers) {
            customerData[customer.name] = {
                totalPurchase: Number(customer.total_spent) || 0,
                invoiceCount: 0, // We could do a join count if needed, or just leave as is for now
                lastPurchase: customer.updated_at || new Date().toISOString(),
                phone: customer.phone,
                email: customer.email,
                id: customer.id
            } as any;
        }
    }

    return (
        <Suspense fallback={<CustomersLoading />}>
            <CustomersClient customerData={customerData} shopId={shopId} />
        </Suspense>
    );
}
