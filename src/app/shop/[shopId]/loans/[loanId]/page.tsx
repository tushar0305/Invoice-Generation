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

    // Fetch shop details
    const { data: shop } = await supabase
        .from('shops')
        .select('shop_name, address, phone_number, email, gst_number, state, pincode')
        .eq('id', shopId)
        .single();

    if (error || !loan) {
        if (process.env.NODE_ENV === 'development') {
            console.error('Error fetching loan:', error);
        }
        return <div>Loan not found</div>;
    }

    if (process.env.NODE_ENV === 'development') {
        console.log('Loan data fetched successfully:', JSON.stringify(loan, null, 2));
    }

    const formattedShopDetails = shop ? {
        name: shop.shop_name,
        address: shop.address,
        phone: shop.phone_number,
        email: shop.email,
        gst: shop.gst_number,
        state: shop.state,
        pincode: shop.pincode
    } : { name: 'Shop Name', address: '', phone: '', email: '' };

    return (
        <LoanDetailsClient
            shopId={shopId}
            loan={loan}
            currentUser={user}
            shopDetails={formattedShopDetails}
        />
    );
}
