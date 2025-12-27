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
    searchParams,
}: {
    params: Promise<{ shopId: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { shopId } = await params;
    const { page: pageParam, limit: limitParam, q } = await searchParams as { page?: string, limit?: string, q?: string };
    const supabase = await createClient();

    const page = Number(pageParam) || 1;
    const limit = Number(limitParam) || 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // 1. Fetch Paginated Customers
    let query = supabase
        .from('customers')
        .select('*, invoices(count)', { count: 'exact' })
        .eq('shop_id', shopId)
        .order('total_spent', { ascending: false }) // Default sort by spend
        .range(from, to);

    if (q) {
        query = query.ilike('name', `%${q}%`);
    }

    const { data: customers, count } = await query;

    // 2. Fetch Top Customer (Global) for the stats card
    const { data: topCustomerData } = await supabase
        .from('customers')
        .select('*')
        .eq('shop_id', shopId)
        .order('total_spent', { ascending: false })
        .limit(1)
        .single();

    // Transform Top Customer
    const topCustomer = topCustomerData ? {
        name: topCustomerData.name,
        totalPurchase: Number(topCustomerData.total_spent) || 0,
        invoiceCount: 0, // We might need a separate query or join for this if important, but for now let's skip or simple join if needed.
        // Actually, the original code used 'invoices(count)'.
        // Let's retry top customer with count if we want to be precise, or just use what we have.
    } : null;

    // If we really need invoice count for top customer:
    let topCustomerInvoiceCount = 0;
    if (topCustomerData) {
        const { count: c } = await supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('customer_id', topCustomerData.id);
        topCustomerInvoiceCount = c || 0;
    }

    // Transform Paginated Data
    const formattedCustomers = (customers || []).map((customer: any) => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        totalPurchase: Number(customer.total_spent) || 0,
        invoiceCount: customer.invoices?.[0]?.count || 0,
        lastPurchase: customer.updated_at || new Date().toISOString(),
    }));

    return (
        <Suspense fallback={<CustomersLoading />}>
            <CustomersClient
                initialCustomers={formattedCustomers}
                shopId={shopId}
                topCustomer={topCustomer ? { ...topCustomer, invoiceCount: topCustomerInvoiceCount } : null}
                pagination={{
                    currentPage: page,
                    totalPages: Math.ceil((count || 0) / limit),
                    totalCount: count || 0,
                    limit
                }}
                searchParams={{ q }}
            />
        </Suspense>
    );
}
