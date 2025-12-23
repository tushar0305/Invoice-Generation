import { Plan, ShopSubscription, ShopUsage } from './subscription-types';
import { supabase } from '@/supabase/client';

export const DEFAULT_FREE_PLAN: Plan = {
    id: 'free',
    name: 'Starter',
    description: 'For small shops',
    price_monthly: 0,
    price_yearly: 0,
    limits: { invoices: 50, customers: 100, staff: 1, ai_tokens: 5000 },
    features: { ai_insights: false, custom_branding: false }
};

export async function getShopSubscription(shopId: string) {
    // 1. Fetch Subscription & Plan Link
    // 1. Fetch Subscription
    const { data: sub, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('shop_id', shopId)
        .single();

    // 2. Fetch Plan Details
    // If sub exists, use its plan_id. Else 'free'.
    const planId = sub?.plan_id || 'free';
    const { data: planDetails } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single();

    // 2. Fetch Usage for Current Period
    // If no sub, assume current month
    const periodStart = sub?.current_period_start || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const { data: usage, error: usageError } = await supabase
        .from('shop_usage_limits')
        .select('*')
        .eq('shop_id', shopId)
        .gte('period_start', periodStart) // Loose match for current period
        .order('period_start', { ascending: false })
        .limit(1)
        .single();

    const effectivePlan: Plan = (planDetails as Plan) || DEFAULT_FREE_PLAN;

    // Handle missing usage record (if new month/new shop)
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

export function checkLimit(limit: number, used: number): boolean {
    if (limit === -1) return true; // Unlimited
    return used < limit;
}
