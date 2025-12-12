import { createClient } from '@/supabase/server';
import { Plan, ShopSubscription, ShopUsage } from '@/lib/subscription-types';
import { DEFAULT_FREE_PLAN } from '@/lib/subscription-service';

export async function getServerShopSubscription(shopId: string) {
    const supabase = await createClient();

    // 1. Fetch Subscription & Plan Link
    const { data: sub } = await supabase
        .from('shop_subscriptions')
        .select(`
            *,
            plan:plans(*)
        `)
        .eq('shop_id', shopId)
        .single();

    // 2. Determine Period Start
    const periodStart = sub?.current_period_start || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    // 3. Fetch Usage
    const { data: usage } = await supabase
        .from('shop_usage_limits')
        .select('*')
        .eq('shop_id', shopId)
        .gte('period_start', periodStart)
        .order('period_start', { ascending: false })
        .limit(1)
        .single();

    const effectivePlan: Plan = sub?.plan || DEFAULT_FREE_PLAN;

    const effectiveUsage: ShopUsage = usage || {
        shop_id: shopId,
        period_start: periodStart,
        invoices_created: 0,
        customers_added: 0,
        staff_seats_occupied: 0,
        ai_tokens_used: 0,
        storage_bytes: 0,
        updated_at: new Date().toISOString()
    };

    return {
        subscription: sub as ShopSubscription | null,
        plan: effectivePlan,
        usage: effectiveUsage
    };
}
