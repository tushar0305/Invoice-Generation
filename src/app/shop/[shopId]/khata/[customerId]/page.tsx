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

    // Fetch customer details
    const { data: customerRaw, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .eq('shop_id', shopId)
        .single();

    if (customerError || !customerRaw) {
        notFound();
    }

    // Fetch all transactions for this customer
    const { data: transactionsRaw, error: transError } = await supabase
        .from('ledger_transactions')
        .select('*')
        .eq('customer_id', customerId)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false });

    if (transError) {
        console.error('Error fetching transactions:', transError);
    }

    // Calculate balance
    let totalPaid = 0;
    let currentBalance = 0;

    const transactions = (transactionsRaw || []).map(t => {
        if (t.entry_type === 'CREDIT') {
            totalPaid += Number(t.amount);
            currentBalance -= Number(t.amount);
        } else {
            currentBalance += Number(t.amount);
        }
        return {
            ...t,
            transaction_type: t.transaction_type as any,
            entry_type: t.entry_type as any
        };
    });

    const customer = {
        id: customerRaw.id,
        shop_id: customerRaw.shop_id,
        name: customerRaw.name,
        phone: customerRaw.phone,
        email: customerRaw.email,
        address: customerRaw.address,
        total_spent: customerRaw.total_spent || 0,
        total_paid: totalPaid,
        current_balance: currentBalance,
        last_transaction_date: transactions.length > 0 ? transactions[0].transaction_date : null
    };

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
