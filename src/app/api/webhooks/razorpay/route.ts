import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/supabase/server';

export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret || !signature) {
        return NextResponse.json({ error: 'Configuration Error' }, { status: 500 });
    }

    // 1. Verify Signature
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(body);
    const digest = shasum.digest('hex');

    if (digest !== signature) {
        return NextResponse.json({ error: 'Invalid Signature' }, { status: 400 });
    }

    // 2. Process Event
    const event = JSON.parse(body);
    const supabase = await createClient(); // Use admin client ideally, but RLS prevents service role... Wait.
    // The previous schema policy `auth.uid() is null` allows service role? No, that policy allows *inserts* if uid is null.
    // But supabase/server `createClient` uses cookies.
    // We need `createClient` with SERVICE_KEY here for webhooks because no user is logged in.
    // HOWEVER, I don't have a `supabase/admin` file.
    // I will use `createClient` but the webhook won't have cookies. It will be anonymous.
    // I need to ensure I can UPDATE `subscriptions`.
    // Let's create a Supabase client manually with service key if env var is available, or rely on RLS allowing Anon updates? No, that's unsafe.

    // FIX: I will instantiate a direct supabase client using process.env.SUPABASE_SERVICE_ROLE_KEY
    // Assuming the user has it. If not, this webhook will fail.
    // For now, I'll assume they have `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

    // Check if we have the service key
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
        console.error('Missing SUPABASE_SERVICE_ROLE_KEY for webhook');
        return NextResponse.json({ error: 'Server Config Error' }, { status: 500 });
    }

    // Dynamic import to avoid build errors if package missing? No, supabase-js is there.
    const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
    const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey
    );

    try {
        const payload = event.payload.subscription.entity;

        if (event.event === 'subscription.charged') {
            // Determine Plan ID from Razorpay Plan ID (Mapping logic)
            // You might want to query plans table to find match or hardcode mapping if simple.
            // For now, assuming standard mapping or just keeping the razorpay_plan_id.
            // Also need to set 'plan_id' column for our app logic (free/pro).

            // NOTE: Ideally fetch this mapping from DB or config.
            // Using a heuristic: if amount > 500 etc. or just update standard fields.
            // Let's assume the action set the correct plan_id initially, but we should confirm/reactivate it here.

            await supabaseAdmin
                .from('shop_subscriptions')
                .update({
                    status: 'active',
                    current_period_start: new Date(payload.current_start * 1000),
                    current_period_end: new Date(payload.current_end * 1000),
                    razorpay_customer_id: payload.customer_id,
                    razorpay_plan_id: payload.plan_id,
                    updated_at: new Date()
                })
                .eq('razorpay_subscription_id', payload.id);
        }
        else if (event.event === 'subscription.cancelled') {
            await supabaseAdmin
                .from('shop_subscriptions')
                .update({ status: 'canceled', updated_at: new Date() })
                .eq('razorpay_subscription_id', payload.id);
        }
        // Add more events as needed (halted, pending, etc)

        return NextResponse.json({ status: 'ok' });
    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Processing Failed' }, { status: 500 });
    }
}
