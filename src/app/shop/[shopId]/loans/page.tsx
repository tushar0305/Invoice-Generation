// ... imports
import { Suspense } from 'react';
import { createClient } from '@/supabase/server';
import { redirect } from 'next/navigation';
import { LoansDashboardClient } from './client';
import { Skeleton } from '@/components/ui/skeleton';
import type { Loan, LoanDashboardStats } from '@/lib/loan-types';

type PageProps = {
    params: Promise<{ shopId: string }>;
};

async function DashboardLoading() {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
            </div>
            <Skeleton className="h-96 w-full" />
        </div>
    );
}

export default async function LoansPage({ params }: PageProps) {
    const { shopId } = await params;
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

    // Fetch active loans (handle case where table doesn't exist)
    const { data: activeLoans, error: loansError } = await supabase
        .from('loans')
        .select(`
            *,
            loan_customers (
                name,
                phone
            )
        `)
        .eq('shop_id', shopId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

    // Only log in development, not production
    if (loansError && process.env.NODE_ENV === 'development') {
        console.log('Loans table not available:', loansError.code);
    }

    // Calculate stats
    const { data: allLoans } = await supabase
        .from('loans')
        .select('id, status, principal_amount, total_interest_accrued')
        .eq('shop_id', shopId);

    const stats: LoanDashboardStats = {
        total_active_loans: 0,
        total_principal_disbursed: 0,
        total_interest_earned: 0,
        total_overdue_loans: 0,
    };

    if (allLoans) {
        stats.total_active_loans = allLoans.filter(l => l.status === 'active').length;
        stats.total_overdue_loans = allLoans.filter(l => l.status === 'overdue').length;
        stats.total_principal_disbursed = allLoans
            .filter(l => l.status === 'active' || l.status === 'overdue')
            .reduce((sum, l) => sum + Number(l.principal_amount), 0);
        stats.total_interest_earned = allLoans.reduce((sum, l) => sum + Number(l.total_interest_accrued), 0);
    }

    // Fetch actual interest earned from payments
    const { data: interestPayments } = await supabase
        .from('loan_payments')
        .select('amount')
        .eq('payment_type', 'interest')
        .in('loan_id', (allLoans || []).map(l => l.id));

    if (interestPayments) {
        stats.total_interest_earned = interestPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    }

    return (
        <Suspense fallback={<DashboardLoading />}>
            <LoansDashboardClient
                loans={activeLoans || []}
                stats={stats}
                shopId={shopId}
            />
        </Suspense>
    );
}
