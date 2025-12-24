import { createClient } from '@/supabase/server';
import { BillingClient } from './client';
import { redirect } from 'next/navigation';
import { razorpay } from '@/lib/razorpay';

export default async function BillingPage({ params }: { params: Promise<{ shopId: string }> }) {
    const { shopId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // Fetch current subscription from database
    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('shop_id', shopId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    // If we have an active subscription, fetch details from Razorpay
    let razorpayDetails = null;
    if (subscription?.razorpay_subscription_id && razorpay) {
        try {
            const rzpSub = await razorpay.subscriptions.fetch(subscription.razorpay_subscription_id);
            razorpayDetails = {
                status: rzpSub.status,
                current_start: rzpSub.current_start ? new Date(rzpSub.current_start * 1000).toISOString() : null,
                current_end: rzpSub.current_end ? new Date(rzpSub.current_end * 1000).toISOString() : null,
                charge_at: rzpSub.charge_at ? new Date(rzpSub.charge_at * 1000).toISOString() : null,
                paid_count: rzpSub.paid_count,
                remaining_count: rzpSub.remaining_count,
                total_count: rzpSub.total_count,
                short_url: rzpSub.short_url,
                customer_id: rzpSub.customer_id,
                plan_id: rzpSub.plan_id
            };
        } catch (error) {
            console.error('Error fetching Razorpay subscription:', error);
        }
    }

    // Merge database subscription with Razorpay details
    const enrichedSubscription = subscription ? {
        ...subscription,
        razorpay: razorpayDetails,
        current_period_start: razorpayDetails?.current_start || subscription.created_at,
        current_period_end: razorpayDetails?.current_end || null
    } : null;

    return (
        <BillingClient
            shopId={shopId}
            currentSubscription={enrichedSubscription}
            userEmail={user.email!}
        />
    );
}
