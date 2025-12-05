import { createClient } from '@/supabase/server';
import { redirect } from 'next/navigation';
import { NewKhataTransactionClient } from './client';

type PageProps = {
    params: Promise<{ shopId: string }>;
};

export default async function NewKhataPage({ params }: PageProps) {
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

    // Fetch existing customers for search
    const { data: customers } = await supabase
        .from('customers')
        .select('id, name, phone, total_spent') // Note: current_balance is not directly available, might need calculation or just show name
        .eq('shop_id', shopId)
        .order('name');

    return (
        <NewKhataTransactionClient
            shopId={shopId}
            existingCustomers={customers || []}
        />
    );
}
