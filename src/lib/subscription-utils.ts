import { createClient } from '@/supabase/server';

type FeatureType = 'invoices' | 'loans' | 'users';

const LIMITS = {
    free: {
        invoices: 50, // Per month
        loans: 0,
        users: 1
    },
    pro: {
        invoices: Infinity,
        loans: Infinity,
        users: 5
    },
    enterprise: {
        invoices: Infinity,
        loans: Infinity,
        users: Infinity
    }
};

export async function checkSubscriptionLimit(shopId: string, feature: FeatureType): Promise<{ allowed: boolean; message?: string }> {
    const supabase = await createClient();

    // 1. Get Subscription
    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan_id, status')
        .eq('shop_id', shopId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    const plan = (subscription?.plan_id as 'free' | 'pro' | 'enterprise') || 'free';
    const limit = LIMITS[plan][feature];

    if (limit === Infinity) return { allowed: true };
    if (limit === 0) return { allowed: false, message: `Your current ${plan} plan does not include ${feature}. Upgrade to Pro.` };

    // 2. Check Usage (Invoices only for now)
    if (feature === 'invoices') {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const { count, error } = await supabase
            .from('invoices')
            .select('*', { count: 'exact', head: true })
            .eq('shop_id', shopId)
            .gte('created_at', startOfMonth);

        if (error) {
            console.error('Error checking usage:', error);
            return { allowed: true }; // Fail open if DB error
        }

        if ((count || 0) >= limit) {
            return { allowed: false, message: `Monthly invoice limit reached (${count}/${limit}). Upgrade to Pro for unlimited invoices.` };
        }
    }

    return { allowed: true };
}
