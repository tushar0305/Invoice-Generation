import { Suspense } from 'react';
import { createClient } from '@/supabase/server';
import { redirect } from 'next/navigation';
import { KhataClient } from './client';
import { MobileKhataBook } from '@/components/mobile/mobile-khata-book';
import type { CustomerBalance, LedgerTransaction } from '@/lib/ledger-types';
import { Skeleton } from '@/components/ui/skeleton';

type PageProps = {
    params: Promise<{ shopId: string }>;
    searchParams: Promise<{ search?: string; balance_type?: string }>;
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
    const { search, balance_type } = await searchParams;

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

    // Fetch customers and calculate balances from ledger transactions
    // Note: In a real app with many transactions, this aggregation should be done via a View or RPC
    // For now, we'll fetch customers and their transactions to calculate

    // 1. Fetch Customers
    let customerQuery = supabase
        .from('customers')
        .select('id, name, phone, email, address, total_spent')
        .eq('shop_id', shopId);

    if (search) {
        customerQuery = customerQuery.ilike('name', `%${search}%`);
    }

    const { data: customers, error: customerError } = await customerQuery;

    if (customerError) {
        console.error('Error fetching customers:', customerError);
    }

    // 2. Fetch Ledger Transactions for these customers to calculate 'total_paid' and 'balance'
    // Actually, 'total_spent' in customers table tracks invoices (DEBITs).
    // We need to track PAYMENTS (CREDITs).
    // Let's fetch all transactions for simplicity in this refactor, or use a view.
    // Better approach: Create a helper function or view.
    // For now, let's assume we can get balance from a new RPC or just fetch transactions.

    // Let's fetch all ledger transactions for the shop to aggregate
    const { data: transactions } = await supabase
        .from('ledger_transactions')
        .select('customer_id, amount, entry_type')
        .eq('shop_id', shopId);

    const balanceMap = new Map<string, { paid: number, balance: number }>();

    if (transactions) {
        transactions.forEach(t => {
            const current = balanceMap.get(t.customer_id) || { paid: 0, balance: 0 };
            if (t.entry_type === 'CREDIT') {
                current.paid += Number(t.amount);
                current.balance -= Number(t.amount);
            } else {
                // DEBIT (Invoice)
                current.balance += Number(t.amount);
            }
            balanceMap.set(t.customer_id, current);
        });
    }

    const customersData: CustomerBalance[] = (customers || []).map(c => {
        const stats = balanceMap.get(c.id) || { paid: 0, balance: 0 };
        return {
            id: c.id,
            shop_id: shopId,
            name: c.name,
            phone: c.phone,
            email: c.email,
            address: c.address,
            total_spent: c.total_spent || 0, // This might be redundant if we calculate from transactions
            total_paid: stats.paid,
            current_balance: stats.balance
        };
    });

    // Filter by balance type if needed
    let filteredCustomers = customersData;
    if (balance_type === 'receivable') {
        filteredCustomers = customersData.filter(c => c.current_balance > 0);
    } else if (balance_type === 'payable') {
        filteredCustomers = customersData.filter(c => c.current_balance < 0);
    } else if (balance_type === 'settled') {
        filteredCustomers = customersData.filter(c => c.current_balance === 0);
    }

    // Sort by balance descending (highest debt first)
    filteredCustomers.sort((a, b) => b.current_balance - a.current_balance);

    // Calculate stats
    const totalCustomers = customersData.length;
    const totalReceivable = customersData
        .filter(c => c.current_balance > 0)
        .reduce((sum, c) => sum + c.current_balance, 0);
    const totalPayable = Math.abs(customersData
        .filter(c => c.current_balance < 0)
        .reduce((sum, c) => sum + c.current_balance, 0));
    const netBalance = totalReceivable - totalPayable;

    // Fetch recent transactions for display
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

    // Map to LedgerTransaction type
    const recentTransactions: LedgerTransaction[] = (recentTransactionsRaw || []).map(t => ({
        ...t,
        transaction_type: t.transaction_type as any,
        entry_type: t.entry_type as any,
        customer: Array.isArray(t.customer) ? t.customer[0] : t.customer
    }));

    return (
        <Suspense fallback={<KhataLoading />}>
            <MobileKhataBook
                shopId={shopId}
                customers={filteredCustomers}
                stats={{
                    total_customers: totalCustomers,
                    total_receivable: totalReceivable,
                    total_payable: totalPayable,
                    net_balance: netBalance,
                }}
                recentTransactions={recentTransactions}
            />
            <div className="hidden md:block">
                <KhataClient
                    customers={filteredCustomers}
                    stats={{
                        total_customers: totalCustomers,
                        total_receivable: totalReceivable,
                        total_payable: totalPayable,
                        net_balance: netBalance,
                    }}
                    recentTransactions={recentTransactions}
                    shopId={shopId}
                    userId={user.id}
                    initialSearch={search || ''}
                />
            </div>
        </Suspense>
    );
}
