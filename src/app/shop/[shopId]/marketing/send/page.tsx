import { Suspense } from 'react';
import { createClient } from '@/supabase/server';
import { redirect } from 'next/navigation';
import { SendCampaignClient } from './client';

interface Props {
    params: Promise<{ shopId: string }>;
}

export default async function SendCampaignPage({ params }: Props) {
    const { shopId } = await params;
    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }

    // Check WhatsApp is connected
    const { data: config } = await supabase
        .from('whatsapp_configs')
        .select('id, phone_number, display_name, status')
        .eq('shop_id', shopId)
        .single();

    if (!config || config.status !== 'connected') {
        redirect(`/shop/${shopId}/marketing`);
    }

    // Get approved templates
    const { data: templates } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('shop_id', shopId)
        .eq('status', 'APPROVED');

    // Get customers with phone numbers
    const { data: customers } = await supabase
        .from('customers')
        .select('id, name, phone, total_purchases')
        .eq('shop_id', shopId)
        .not('phone', 'is', null)
        .order('total_purchases', { ascending: false });

    return (
        <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <SendCampaignClient
                shopId={shopId}
                templates={templates || []}
                customers={customers || []}
            />
        </Suspense>
    );
}
