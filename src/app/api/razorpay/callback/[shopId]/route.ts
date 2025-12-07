import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Razorpay sends POST to callback_url
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ shopId: string }> }
) {
    const { shopId } = await params;

    try {
        // Parse form data from Razorpay
        const formData = await request.formData();
        const razorpay_payment_id = formData.get('razorpay_payment_id') as string;
        const razorpay_subscription_id = formData.get('razorpay_subscription_id') as string;
        const razorpay_signature = formData.get('razorpay_signature') as string;

        console.log('Razorpay Callback:', { shopId, razorpay_payment_id, razorpay_subscription_id });

        if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
            return NextResponse.redirect(
                new URL(`/shop/${shopId}/payment-result?status=error&message=Missing payment details`, request.url)
            );
        }

        // Verify Signature
        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!secret) {
            return NextResponse.redirect(
                new URL(`/shop/${shopId}/payment-result?status=error&message=Server configuration error`, request.url)
            );
        }

        const body = razorpay_payment_id + '|' + razorpay_subscription_id;
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return NextResponse.redirect(
                new URL(`/shop/${shopId}/payment-result?status=error&message=Invalid payment signature`, request.url)
            );
        }

        // Fetch subscription details from Razorpay API
        const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
        let razorpaySubDetails: any = null;

        try {
            const rzpResponse = await fetch(
                `https://api.razorpay.com/v1/subscriptions/${razorpay_subscription_id}`,
                {
                    headers: {
                        'Authorization': 'Basic ' + Buffer.from(`${keyId}:${secret}`).toString('base64')
                    }
                }
            );
            if (rzpResponse.ok) {
                razorpaySubDetails = await rzpResponse.json();
                console.log('Fetched Razorpay subscription:', razorpaySubDetails);
            }
        } catch (err) {
            console.error('Error fetching Razorpay subscription details:', err);
        }

        // Use service role client to bypass RLS
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.redirect(
                new URL(`/shop/${shopId}/payment-result?status=error&message=Database configuration error`, request.url)
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        // Check if subscription exists
        const { data: existingSub } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('razorpay_subscription_id', razorpay_subscription_id)
            .maybeSingle();

        const now = new Date().toISOString();

        // Use Razorpay's dates if available, otherwise calculate
        const currentStart = razorpaySubDetails?.current_start
            ? new Date(razorpaySubDetails.current_start * 1000).toISOString()
            : now;
        const currentEnd = razorpaySubDetails?.current_end
            ? new Date(razorpaySubDetails.current_end * 1000).toISOString()
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // +30 days

        const subscriptionData = {
            status: 'active',
            plan_id: 'pro',
            razorpay_subscription_id: razorpay_subscription_id,
            razorpay_plan_id: razorpaySubDetails?.plan_id || null,
            razorpay_customer_id: razorpaySubDetails?.customer_id || null,
            current_period_start: currentStart,
            current_period_end: currentEnd,
            updated_at: now
        };

        if (existingSub) {
            const { error: updateError } = await supabase
                .from('subscriptions')
                .update(subscriptionData)
                .eq('razorpay_subscription_id', razorpay_subscription_id);

            if (updateError) throw updateError;
            console.log('Subscription updated successfully');
        } else {
            const { error: insertError } = await supabase
                .from('subscriptions')
                .insert({
                    ...subscriptionData,
                    shop_id: shopId,
                    created_at: now
                });

            if (insertError) throw insertError;
            console.log('Subscription created successfully');
        }

        return NextResponse.redirect(
            new URL(`/shop/${shopId}/payment-result?status=success&subscription_id=${razorpay_subscription_id}`, request.url)
        );

    } catch (error: any) {
        console.error('Payment callback error:', error);
        return NextResponse.redirect(
            new URL(`/shop/${shopId}/payment-result?status=error&message=${encodeURIComponent(error.message || 'Payment processing failed')}`, request.url)
        );
    }
}
