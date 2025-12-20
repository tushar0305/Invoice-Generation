import { Suspense } from 'react';
import { createClient } from '@/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { CustomerLedgerClient } from './client';
import { Skeleton } from '@/components/ui/skeleton';
import type { UnifiedParty, LedgerTransaction } from '@/lib/ledger-types';

export const dynamic = 'force-dynamic';

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
    if (authError || !user) redirect('/login');

    const { data: userRole } = await supabase
        .from('user_shop_roles')
        .select('role')
        .eq('shop_id', shopId)
        .eq('user_id', user.id)
        .single();

    if (!userRole) redirect('/dashboard');

    // 1. Fetch Contact Details
    const { data: contact, error: viewError } = await supabase
        .from('khatabook_contacts')
        .select('*')
        .eq('id', customerId)
        .eq('shop_id', shopId)
        .single();

    if (viewError || !contact) notFound();

    // 2. Fetch Transactions
    const { data: transactionsRaw, error: transError } = await supabase
        .from('ledger_transactions')
        .select(`
            *,
            documents:transaction_documents(*)
        `)
        .eq('khatabook_contact_id', customerId) // Use correct column
        .eq('shop_id', shopId)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false });

    if (transError) console.error('Error fetching transactions:', JSON.stringify(transError, null, 2));

    // 3. Calculate Running Balances & Totals from Transactions
    let totalDebit = 0;
    let totalCredit = 0;

    // We can use the fetched transactions to calculate exact totals
    (transactionsRaw || []).forEach(t => {
        if (t.entry_type === 'DEBIT') totalDebit += Number(t.amount);
        else totalCredit += Number(t.amount);
    });

    const transactions: LedgerTransaction[] = (transactionsRaw || []).map(t => ({
        ...t,
        transaction_type: t.transaction_type as any,
        entry_type: t.entry_type as any,
        documents: t.documents || []
    }));

    // Construct the Prop Object
    const entity: UnifiedParty = {
        id: contact.id,
        shop_id: contact.shop_id,
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        address: contact.address,
        entity_type: contact.type as any || 'CUSTOMER',
        source_table: 'khatabook_contact',
        is_deleted: contact.deleted_at ? true : false,
        total_debit: totalDebit,
        total_credit: totalCredit,
        current_balance: totalDebit - totalCredit, // Recalculate or use view if preferred (removed view query for simplicity)
        transaction_count: transactions.length,
        last_transaction_date: transactions[0]?.transaction_date || null,

        // Legacy aliases
        total_spent: totalDebit,
        total_paid: totalCredit
    };

    return (
        <Suspense fallback={<LedgerLoading />}>
            <CustomerLedgerClient
                entity={entity}
                transactions={transactions}
                shopId={shopId}
                userId={user.id}
            />
        </Suspense>
    );
}
