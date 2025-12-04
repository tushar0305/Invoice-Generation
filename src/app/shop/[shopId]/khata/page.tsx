import { Suspense } from 'react';
import { createClient } from '@/supabase/server';
import { redirect } from 'next/navigation';
import { KhataClient } from './client';
import { MobileKhataBook } from '@/components/mobile/mobile-khata-book';
import type { KhataCustomerBalance } from '@/lib/khata-types';
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

    // Fetch customers with balances
    const { data: customers, error } = await supabase
        .from('khata_customer_balances')
        .select('*')
        .eq('shop_id', shopId)
        .order('current_balance', { ascending: false });

    if (error) {
        console.error('Error fetching khata customers:', error);
    }

    const customersData: KhataCustomerBalance[] = customers || [];

    // Calculate stats
    const totalCustomers = customersData.length;
    const totalReceivable = customersData
        .filter(c => c.current_balance > 0)
        .reduce((sum, c) => sum + c.current_balance, 0);
    const totalPayable = Math.abs(customersData
        .filter(c => c.current_balance < 0)
        .reduce((sum, c) => sum + c.current_balance, 0));
    const netBalance = totalReceivable - totalPayable;

    // Fetch recent transactions
    const { data: recentTransactions } = await supabase
        .from('khata_transactions')
        .select(`
            *,
            khata_customers (
                name
            )
        `)
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })
        .limit(10);

    return (
        <Suspense fallback={<KhataLoading />}>
            <MobileKhataBook 
                shopId={shopId} 
                customers={customersData} 
                stats={{
                    total_customers: totalCustomers,
                    total_receivable: totalReceivable,
                    total_payable: totalPayable,
                    net_balance: netBalance,
                }}
                recentTransactions={recentTransactions || []}
            />
            <div className="hidden md:block">
                <KhataClient
                    customers={customersData}
                    stats={{
                        total_customers: totalCustomers,
                        total_receivable: totalReceivable,
                        total_payable: totalPayable,
                        net_balance: netBalance,
                    }}
                    recentTransactions={recentTransactions || []}
                    shopId={shopId}
                    userId={user.id}
                    initialSearch={search || ''}
                />
            </div>
        </Suspense>
    );
}
