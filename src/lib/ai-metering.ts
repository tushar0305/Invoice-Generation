import { createClient } from '@/supabase/server';
import { checkUsageLimit } from './subscription-gate';

// Simple estimation: 1 token ~= 4 characters
export function estimateTokens(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
}

export async function trackAiUsage(
    shopId: string,
    model: string,
    inputTokens: number,
    outputTokens: number
) {
    const supabase = await createClient();
    const totalTokens = inputTokens + outputTokens;

    // 1. Log detailed event (for audit/analytics)
    const { error: eventError } = await supabase.from('usage_events').insert({
        shop_id: shopId,
        event_type: 'ai_completion',
        metric: 'ai_tokens_used',
        amount: totalTokens,
        metadata: { model, input_tokens: inputTokens, output_tokens: outputTokens }
    });

    if (eventError) console.error('Failed to log AI usage event', eventError);

    // 2. Increment aggregate usage (Atomic update)
    // We already have triggers for invoices, but for arbitrary counters we can 
    // use a direct RPC call or a smart upsert. 
    // Since we don't have a specific trigger for "usage_events" -> "aggregates" for *every* metric,
    // we'll explicitly update the aggregate table.

    // We need to fetch the current period start first to ensure we update the right row.
    // (Or rely on the helper to get it, but SQL is faster)

    // Using a custom RPC is best for atomicity, but standard update is fine for now
    // as we are not under extreme concurrency.

    // Simple approach: Get period from subscription or default to month start
    const { data: sub } = await supabase
        .from('shop_subscriptions')
        .select('current_period_start')
        .eq('shop_id', shopId)
        .single();

    const periodStart = sub?.current_period_start || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const { error: aggError } = await supabase.rpc('increment_usage_metric', {
        p_shop_id: shopId,
        p_period_start: periodStart,
        p_metric: 'ai_tokens_used',
        p_amount: totalTokens
    });

    // Fallback if RPC doesn't exist (we haven't created it yet! Let's just do an upsert or let the user create RPC)
    // Actually, let's create the RPC function in a migration script for the user, 
    // OR just use a standard upsert if we can ensure row existence.
    // But `shop_usage_limits` has a composite PK (shop_id, period_start).

    if (aggError) {
        // Fallback: Standard Upsert with basic increment logic (safe enough for low volume)
        // Note: This isn't perfectly atomic under high load without RPC

        // Fetch current
        const { data: current } = await supabase
            .from('shop_usage_limits')
            .select('ai_tokens_used')
            .eq('shop_id', shopId)
            .eq('period_start', periodStart)
            .single();

        const currentCount = current?.ai_tokens_used || 0;

        await supabase
            .from('shop_usage_limits')
            .upsert({
                shop_id: shopId,
                period_start: periodStart,
                ai_tokens_used: currentCount + totalTokens,
                updated_at: new Date().toISOString()
            }, { onConflict: 'shop_id, period_start' });
    }
}

export async function checkAiAvailability(shopId: string, estimatedTokens: number) {
    return checkUsageLimit(shopId, 'ai_tokens', estimatedTokens);
}
