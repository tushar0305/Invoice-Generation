'use server';

import { createClient } from '@/supabase/server';
import { razorpay, RAZORPAY_PLANS } from '@/lib/razorpay';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function createSubscriptionAction(shopId: string, planType: 'PRO_MONTHLY' | 'PRO_YEARLY') {
    const supabase = await createClient();

    // 1. Auth & Permission Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { data: role } = await supabase
        .from('user_shop_roles')
        .select('role')
        .eq('shop_id', shopId)
        .eq('user_id', user.id)
        .single();

    if (!role || (role.role !== 'owner' && role.role !== 'manager')) {
        throw new Error('Permission denied');
    }

    // 2. Init Razorpay Subscription
    const planConfig = RAZORPAY_PLANS[planType];
    if (!planConfig.razorpayPlanId) {
        throw new Error('Plan Configuration Missing (ID)');
    }

    try {
        const subscription = await razorpay.subscriptions.create({
            plan_id: planConfig.razorpayPlanId,
            customer_notify: 1,
            quantity: 1,
            total_count: 120, // 10 years auto-renew basically
            notes: {
                shop_id: shopId,
                user_id: user.id,
                plan_type: planType
            }
        });

        // The key for client-side checkout (public key)
        const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;

        if (!keyId) {
            throw new Error('Razorpay Key ID is not configured. Please set NEXT_PUBLIC_RAZORPAY_KEY_ID in your environment variables.');
        }

        return {
            subscriptionId: subscription.id,
            keyId: keyId
        };

    } catch (error: any) {
        console.error('Razorpay Create Error:', error);
        throw new Error(error.error?.description || error.message || 'Failed to create subscription');
    }
}

export async function cancelSubscriptionAction(shopId: string, subscriptionId: string, cancelAtPeriodEnd: boolean = true) {
    const supabase = await createClient();

    // Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { data: role } = await supabase
        .from('user_shop_roles')
        .select('role')
        .eq('shop_id', shopId)
        .eq('user_id', user.id)
        .single();

    if (!role || (role.role !== 'owner' && role.role !== 'manager')) {
        throw new Error('Only shop owners or managers can cancel subscriptions');
    }

    try {
        // Cancel in Razorpay
        // cancel_at_cycle_end: true means subscription will remain active till period end
        await razorpay.subscriptions.cancel(subscriptionId, cancelAtPeriodEnd);

        // Update DB
        await supabase
            .from('subscriptions')
            .update({
                status: cancelAtPeriodEnd ? 'active' : 'canceled',
                cancel_at_period_end: cancelAtPeriodEnd,
                updated_at: new Date().toISOString()
            })
            .eq('razorpay_subscription_id', subscriptionId);

        revalidatePath(`/shop/${shopId}/settings/billing`);
        return {
            success: true, message: cancelAtPeriodEnd
                ? 'Subscription will be cancelled at the end of the billing period'
                : 'Subscription cancelled immediately'
        };
    } catch (error: any) {
        console.error('Cancel subscription error:', error);
        throw new Error(error.error?.description || 'Failed to cancel subscription');
    }
}

