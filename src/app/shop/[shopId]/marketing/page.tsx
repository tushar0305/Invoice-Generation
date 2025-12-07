import { Suspense } from 'react';
import { createClient } from '@/supabase/server';
import { redirect } from 'next/navigation';
import { MarketingDashboardClient } from './client';

interface Props {
    params: Promise<{ shopId: string }>;
}

// Force HMR update
export default async function MarketingPage({ params }: Props) {
    const { shopId } = await params;
    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }

    // Check shop access
    const { data: role } = await supabase
        .from('user_shop_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('shop_id', shopId)
        .single();

    if (!role) {
        redirect('/');
    }

    // Get WhatsApp config
    const { data: config } = await supabase
        .from('whatsapp_configs')
        .select('id, phone_number, display_name, status')
        .eq('shop_id', shopId)
        .single();

    // Get templates
    const { data: templates } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

    // Get message stats
    const { count: totalMessages } = await supabase
        .from('whatsapp_messages')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shopId);

    // Get customer count
    const { count: customerCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shopId)
        .not('phone', 'is', null);

    return (
        <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <MarketingDashboardClient
                shopId={shopId}
                config={config}
                templates={templates || []}
                totalMessages={totalMessages || 0}
                customerCount={customerCount || 0}
                isOwner={role.role === 'owner'}
            />
        </Suspense>
    );
}
