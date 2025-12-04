import { createClient } from '@/supabase/server';
import { redirect } from 'next/navigation';
import { LoanDetailsClient } from './client';

type Props = {
    params: Promise<{
        shopId: string;
        loanId: string;
    }>;
};

export default async function LoanDetailsPage({ params }: Props) {
    const { shopId, loanId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        redirect('/auth/login');
    }

    // Fetch loan details with related data
    const { data: loan, error } = await supabase
        .from('loans')
        .select(`
            *,
            customer:loan_customers(*),
            collateral:loan_collateral(*),
            payments:loan_payments(*)
        `)
        .eq('id', loanId)
        .eq('shop_id', shopId)
        .single();

    if (error || !loan) {
        console.error('Error fetching loan:', error);
        return <div>Loan not found</div>;
    }

    console.log('Loan data fetched successfully:', JSON.stringify(loan, null, 2));

    return (
        <LoanDetailsClient
            shopId={shopId}
            loan={loan}
            currentUser={user}
        />
    );
}
