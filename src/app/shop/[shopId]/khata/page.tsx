import { Suspense } from 'react';
import { createClient } from '@/supabase/server';
import { redirect } from 'next/navigation';
import { KhataClient } from './client';
import { MobileKhataBook } from '@/components/mobile/mobile-khata-book';
import type { CustomerBalance, LedgerTransaction } from '@/lib/ledger-types';
import { Skeleton } from '@/components/ui/skeleton';
import { getDeviceType } from '@/lib/device';

type PageProps = {
    params: Promise<{ shopId: string }>;
    searchParams: Promise<{ search?: string; balance_type?: string; page?: string }>;
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
    const { search, balance_type, page } = await searchParams;
    const currentPage = Number(page) || 1;
    const itemsPerPage = 20;

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

    // --- 1. Fetch Aggregated Stats (Optimized) ---
    // Instead of fetching all transactions, we use the View to get sums directly if possible, or count.
    // Ideally we'd have a separate `shop_stats_view`, but we can query the `customer_balances_view` efficiently.

    // Check if view exists first (Development fallback safety) or just query it.
    // We assume the view implementation applies here.

    // Calculate total Stats
    const { data: statsData, error: statsError } = await supabase
        .from('customer_balances_view')
        .select('current_balance')
        .eq('shop_id', shopId);

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

    // --- 2. Fetch Paginated Customers ---
    let query = supabase
        .from('customer_balances_view')
        .select('*', { count: 'exact' })
        .eq('shop_id', shopId);

    // Apply Search
    if (search) {
        query = query.ilike('name', `%${search}%`);
    }

    // Apply Filters
    if (balance_type === 'receivable') {
        query = query.gt('current_balance', 0);
    } else if (balance_type === 'payable') {
        query = query.lt('current_balance', 0);
    } else if (balance_type === 'settled') {
        query = query.eq('current_balance', 0);
    }

    // Apply Pagination
    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    const { data: customersRaw, count, error: queryError } = await query
        .order('current_balance', { ascending: false }) // Show highest debt first usually
        .range(from, to);

    if (queryError) console.error('[Khata] Query Error:', queryError);
    console.log('[Khata] Customers Found:', count, 'Search:', search, 'Filter:', balance_type);

    const totalPages = count ? Math.ceil(count / itemsPerPage) : 0;

    const customers: CustomerBalance[] = (customersRaw || []).map(c => ({
        id: c.id,
        shop_id: c.shop_id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        address: c.address,
        total_spent: Number(c.total_debit || 0),
        total_paid: Number(c.total_credit || 0),
        current_balance: Number(c.current_balance || 0)
    }));


    // --- 3. Fetch Recent Activity (Optimized limit) ---
    const { data: recentTransactionsRaw } = await supabase
        .from('ledger_transactions')
        .select(`
            *,
            customer:customers (
                name,
                phone
            )
        `)
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })
        .limit(10);

    const recentTransactions: LedgerTransaction[] = (recentTransactionsRaw || []).map(t => ({
        ...t,
        transaction_type: t.transaction_type as any,
        entry_type: t.entry_type as any,
        customer: Array.isArray(t.customer) ? t.customer[0] : t.customer
    }));

    const deviceType = await getDeviceType();
    const isMobile = deviceType === 'mobile';

    if (isMobile) {
        return (
            <Suspense fallback={<KhataLoading />}>
                <MobileKhataBook
                    shopId={shopId}
                    customers={customers}
                    stats={{
                        total_customers: stats.total_customers,
                        total_receivable: stats.total_receivable,
                        total_payable: stats.total_payable,
                        net_balance: stats.net_balance,
                    }}
                    recentTransactions={recentTransactions}
                />
            </Suspense>
        );
    }

    return (
        <Suspense fallback={<KhataLoading />}>
            <div className="hidden md:block">
                <KhataClient
                    customers={customers}
                    stats={{
                        total_customers: stats.total_customers,
                        total_receivable: stats.total_receivable,
                        total_payable: stats.total_payable,
                        net_balance: stats.net_balance,
                    }}
                    recentTransactions={recentTransactions}
                    shopId={shopId}
                    userId={user.id}
                    initialSearch={search || ''}
                    initialBalanceType={balance_type as any}
                    pagination={{
                        currentPage,
                        totalPages,
                        totalItems: count || 0
                    }}
                />
            </div>
            {/* Fallback for resizing on desktop */}
            <div className="md:hidden p-8 text-center text-muted-foreground">
                <p>Resize window or refresh to view mobile layout.</p>
            </div>
        </Suspense>
    );
}
