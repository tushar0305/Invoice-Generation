// ... imports
import { Suspense } from 'react';
import { createClient } from '@/supabase/server';
import { redirect } from 'next/navigation';
import { KhataClient } from './client';
import type { CustomerBalance, LedgerTransaction, UnifiedParty } from '@/lib/ledger-types';
import { Skeleton } from '@/components/ui/skeleton';

type PageProps = {
    params: Promise<{ shopId: string }>;
    searchParams: Promise<{ search?: string; balance_type?: string; page?: string; type?: string }>;
};

async function KhataLoading() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
            </div>
            <Skeleton className="h-96 w-full" />
        </div>
    );
}

export default async function KhataPage({ params, searchParams }: PageProps) {
    const { shopId } = await params;
    const { search, balance_type, type, page } = await searchParams; // Added 'type' param
    const currentPage = Number(page) || 1;
    const itemsPerPage = 20;

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

    // --- 1. Fetch Aggregated Stats ---
    const { data: statsData, error: statsError } = await supabase
        .from('khatabook_ledger_view')
        .select('current_balance')
        .eq('shop_id', shopId)
        .eq('is_deleted', false); // Ensure active entities

    if (statsError) console.error('[Khata] Stats View Error:', statsError);

    const stats = {
        total_customers: statsData?.length || 0,
        total_receivable: 0,
        total_payable: 0,
        net_balance: 0
    };

    if (statsData) {
        statsData.forEach(c => {
            const bal = Number(c.current_balance);
            if (bal > 0) stats.total_receivable += bal;
            if (bal < 0) stats.total_payable += Math.abs(bal);
        });
        stats.net_balance = stats.total_receivable - stats.total_payable;
    }

    // 1. Fetch Aggregated Balances from New View
    let query = supabase
        .from('khatabook_ledger_view')
        .select('*', { count: 'exact' }) // Added count: 'exact' back
        .eq('shop_id', shopId)
        .eq('is_deleted', false);

    if (search) {
        query = query.ilike('name', `% ${search}% `);
    }

    if (balance_type === 'receivable') { // Receivables (You Gave)
        query = query.gt('current_balance', 0);
    } else if (balance_type === 'payable') { // Payables (You Got)
        query = query.lt('current_balance', 0);
    } else if (balance_type === 'settled') { // Settled
        query = query.eq('current_balance', 0);
    }

    // Filter by Entity Type if specified
    if (type && type !== 'all') {
        const typeMap: Record<string, string> = {
            'customer': 'CUSTOMER', // Changed from 'customers' to 'customer' to match existing logic
            'supplier': 'SUPPLIER', // Changed from 'suppliers' to 'supplier'
            'karigar': 'KARIGAR', // Changed from 'karigars' to 'karigar'
            'partner': 'PARTNER' // Changed from 'partners' to 'partner'
        };
        const mappedType = typeMap[type];
        if (mappedType) {
            query = query.eq('entity_type', mappedType);
        }
    }

    // Pagination
    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    const { data: entitiesRaw, count, error } = await query
        .order('latest_transaction_date', { ascending: false }) // Sort by recent activity
        .range(from, to);

    if (error) {
        console.error('Error fetching khata entities:', error);
    }

    const totalPages = count ? Math.ceil(count / itemsPerPage) : 0; // Moved totalPages calculation here

    const entities: UnifiedParty[] = (entitiesRaw || []).map(c => ({
        id: c.id,
        shop_id: c.shop_id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        address: c.address,
        entity_type: c.entity_type as any,
        source_table: 'khatabook_contact',
        is_deleted: c.is_deleted,

        // Stats
        total_debit: Number(c.total_debit || 0),
        total_credit: Number(c.total_credit || 0),
        current_balance: Number(c.current_balance || 0),
        transaction_count: Number(c.transaction_count || 0),
        last_transaction_date: c.latest_transaction_date, // Note: View col changed name slightly implies I should match it

        // Legacy
        total_spent: Number(c.total_debit || 0),
        total_paid: Number(c.total_credit || 0)
    }));

    // 2. Fetch Recent Transactions (Global Scope for User reference?)
    // Actually, maybe just fetch recent KHATA transactions.
    const { data: transactionsRaw } = await supabase
        .from('ledger_transactions')
        .select(`
    *,
    khatabook_contact: khatabook_contacts(name, phone)
        `)
        .eq('shop_id', shopId)
        .not('khatabook_contact_id', 'is', null) // Only khata transactions
        .order('transaction_date', { ascending: false }) // Changed from 'created_at' to 'transaction_date'
        .limit(10); // Changed limit to 10 to match original

    const recentTransactions: LedgerTransaction[] = (transactionsRaw || []).map(t => {
        // Resolve party name/details from the khatabook_contact relation
        const partyName = t.khatabook_contact?.name;
        const partyPhone = t.khatabook_contact?.phone;

        return {
            ...t,
            transaction_type: t.transaction_type as any, // Cast to known union
            entry_type: t.entry_type as any,
            customer: { name: partyName || 'Unknown', phone: partyPhone } // Map to 'customer' prop for UI compatibility
        };
    });

    return (
        <Suspense fallback={<KhataLoading />}>
            <KhataClient
                customers={entities} // Passing unified entities as customers
                stats={stats}
                recentTransactions={recentTransactions}
                shopId={shopId}
                userId={user.id}
                initialSearch={search || ''}
                initialBalanceType={balance_type as any}
                initialType={type || 'all'}
                pagination={{
                    currentPage,
                    totalPages,
                    totalItems: count || 0
                }}
            />
        </Suspense>
    );
}
