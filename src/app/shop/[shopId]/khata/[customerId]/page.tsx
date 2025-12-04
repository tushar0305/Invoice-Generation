import { Suspense } from 'react';
import { createClient } from '@/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { CustomerLedgerClient } from './client';
import { Skeleton } from '@/components/ui/skeleton';

type PageProps = {
    params: Promise<{ shopId: string; customerId: string }>;
};

async function LedgerLoading() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-96 w-full" />
        </div>
    );
}

export default async function CustomerLedgerPage({ params }: PageProps) {
    const { shopId, customerId } = await params;

    const supabase = await createClient();

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        redirect('/login');
    }

    // Check shop access
    const { data: userRole } = await supabase
        .from('user_shop_roles')
        .select('role')
        .eq('shop_id', shopId)
        .eq('user_id', user.id)
        .single();

    if (!userRole) {
        redirect('/dashboard');
    }

    // Fetch customer with balance
    const { data: customer, error: customerError } = await supabase
        .from('khata_customer_balances')
        .select('*')
        .eq('id', customerId)
        .eq('shop_id', shopId)
        .single();

    if (customerError || !customer) {
        notFound();
    }

    // Fetch all transactions for this customer
    const { data: transactions, error: transError } = await supabase
        .from('khata_transactions')
        .select('*')
        .eq('customer_id', customerId)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false });

    if (transError) {
        console.error('Error fetching transactions:', transError);
    }

    return (
        <Suspense fallback={<LedgerLoading />}>
            <CustomerLedgerClient
                customer={customer}
                transactions={transactions || []}
                shopId={shopId}
                userId={user.id}
            />
        </Suspense>
    );
}
