import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

console.log("Razorpay Webhook Edge Function Started");

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, x-razorpay-signature, Authorization",
            },
        });
    }

    if (req.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
    }

    const webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
    const signature = req.headers.get("x-razorpay-signature");

    // Allow test calls without signature (for debugging)
    const body = await req.text();

    // Check if this is a test call
    if (body.includes('"name":"Functions"')) {
        return new Response(JSON.stringify({
            status: "ok",
            message: "Webhook is working!",
            timestamp: new Date().toISOString()
        }), {
            headers: { "Content-Type": "application/json" },
        });
    }

    if (!webhookSecret) {
        console.error("RAZORPAY_WEBHOOK_SECRET not configured");
        return new Response("Webhook secret not configured", { status: 500 });
    }

    if (!signature) {
        console.error("Missing x-razorpay-signature header");
        return new Response("Missing signature", { status: 400 });
    }

    // Verify Signature (HMAC SHA256)
    const encoder = new TextEncoder();
    const keyData = encoder.encode(webhookSecret);
    const key = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"]
    );

    const signatureBytes = await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(body)
    );

    const signatureHex = Array.from(new Uint8Array(signatureBytes))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    if (signatureHex !== signature) {
        console.error("Signature mismatch. Expected:", signatureHex, "Got:", signature);
        return new Response("Invalid Signature", { status: 400 });
    }

    console.log("Signature verified successfully");

    // Process Event
    const event = JSON.parse(body);
    console.log("Received event:", event.event);

    // Supabase Client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        const payload = event.payload?.subscription?.entity;

        if (!payload) {
            console.log("No subscription entity in payload, skipping");
            return new Response(JSON.stringify({ status: "ok", message: "No action needed" }), {
                headers: { "Content-Type": "application/json" },
            });
        }

        console.log("Processing subscription:", payload.id, "Event:", event.event);

        if (event.event === "subscription.activated" || event.event === "subscription.charged") {
            // Subscription is now active or renewed
            const { error } = await supabase
                .from('subscriptions')
                .update({
                    status: 'active',
                    razorpay_plan_id: payload.plan_id,
                    razorpay_customer_id: payload.customer_id,
                    current_period_start: new Date(payload.current_start * 1000).toISOString(),
                    current_period_end: new Date(payload.current_end * 1000).toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('razorpay_subscription_id', payload.id);

            if (error) {
                console.error("Error updating subscription:", error);
                throw error;
            }
            console.log("Subscription activated/charged:", payload.id);
        }
        else if (event.event === "subscription.pending") {
            await supabase
                .from('subscriptions')
                .update({ status: 'past_due', updated_at: new Date().toISOString() })
                .eq('razorpay_subscription_id', payload.id);
            console.log("Subscription pending:", payload.id);
        }
        else if (event.event === "subscription.halted") {
            await supabase
                .from('subscriptions')
                .update({ status: 'unpaid', updated_at: new Date().toISOString() })
                .eq('razorpay_subscription_id', payload.id);
            console.log("Subscription halted:", payload.id);
        }
        else if (event.event === "subscription.cancelled") {
            await supabase
                .from('subscriptions')
                .update({
                    status: 'canceled',
                    cancel_at_period_end: true,
                    updated_at: new Date().toISOString()
                })
                .eq('razorpay_subscription_id', payload.id);
            console.log("Subscription cancelled:", payload.id);
        }
        else if (event.event === "subscription.completed") {
            await supabase
                .from('subscriptions')
                .update({
                    status: 'canceled',
                    updated_at: new Date().toISOString()
                })
                .eq('razorpay_subscription_id', payload.id);
            console.log("Subscription completed:", payload.id);
        }

        return new Response(JSON.stringify({ status: "ok" }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (err: any) {
        console.error("Webhook error:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
});
