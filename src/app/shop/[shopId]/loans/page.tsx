// ... imports
import { Suspense } from 'react';
import { createClient } from '@/supabase/server';
import { redirect } from 'next/navigation';
import { LoansDashboardClient } from './client';
import { Skeleton } from '@/components/ui/skeleton';
import type { Loan, LoanDashboardStats } from '@/lib/loan-types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Sparkles } from 'lucide-react';
import Link from 'next/link';

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

// Pro Feature Gate Component
function ProFeatureGate({ shopId }: { shopId: string }) {
    return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
            <Card className="max-w-lg w-full text-center border-amber-500/20 shadow-xl">
                <CardHeader className="pb-4">
                    <div className="mx-auto mb-4 p-4 rounded-full bg-amber-500/10">
                        <Lock className="h-10 w-10 text-amber-500" />
                    </div>
                    <CardTitle className="text-2xl flex items-center justify-center gap-2">
                        <Sparkles className="h-5 w-5 text-amber-500" />
                        Pro Feature
                        <Sparkles className="h-5 w-5 text-amber-500" />
                    </CardTitle>
                    <CardDescription className="text-base">
                        The Loans & Girvi module is available on the Pro plan
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-muted/50 rounded-lg p-4 text-left">
                        <h4 className="font-semibold mb-2">With Pro you get:</h4>
                        <ul className="text-sm text-muted-foreground space-y-2">
                            <li>✓ Unlimited Loans & Girvi tracking</li>
                            <li>✓ Automatic interest calculation</li>
                            <li>✓ Payment reminders</li>
                            <li>✓ Collateral management</li>
                            <li>✓ Detailed loan reports</li>
                        </ul>
                    </div>
                    <Button asChild size="lg" className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
                        <Link href={`/shop/${shopId}/settings/billing`}>
                            Upgrade to Pro
                        </Link>
                    </Button>
                </CardContent>
            </Card>
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

    // Check subscription - Loans is a Pro feature
    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan_id, status')
        .eq('shop_id', shopId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    const isPro = subscription?.plan_id === 'pro' && subscription?.status === 'active';

    // If not Pro, show upgrade gate
    if (!isPro) {
        return <ProFeatureGate shopId={shopId} />;
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

