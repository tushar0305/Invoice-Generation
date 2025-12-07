'use server';

import { createClient } from '@/supabase/server';
import crypto from 'crypto';

export async function verifyRazorpayPayment(
    razorpay_payment_id: string,
    razorpay_subscription_id: string,
    razorpay_signature: string,
    shopId: string
) {
    const supabase = await createClient();

    // 1. Verify Signature
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
        throw new Error('Razorpay secret not configured');
    }

    const body = razorpay_payment_id + '|' + razorpay_subscription_id;
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');

    if (expectedSignature !== razorpay_signature) {
        throw new Error('Invalid payment signature');
    }

    // 2. Update/Insert Subscription in DB
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // Check if subscription record exists
    const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('razorpay_subscription_id', razorpay_subscription_id)
        .maybeSingle();

    if (existingSub) {
        // Update existing
        await supabase
            .from('subscriptions')
            .update({
                status: 'active',
                razorpay_payment_id: razorpay_payment_id,
                updated_at: new Date().toISOString()
            })
            .eq('razorpay_subscription_id', razorpay_subscription_id);
    } else {
        // Create new subscription record
        await supabase
            .from('subscriptions')
            .insert({
                shop_id: shopId,
                plan_id: 'pro', // Will be updated by webhook with actual plan
                status: 'active',
                razorpay_subscription_id: razorpay_subscription_id,
                razorpay_payment_id: razorpay_payment_id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
    }

    return { success: true };
}
