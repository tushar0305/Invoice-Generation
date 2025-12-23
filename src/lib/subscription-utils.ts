import { createClient } from '@/supabase/server';

type FeatureType = 'invoices' | 'loans' | 'users';

export async function checkSubscriptionLimit(shopId: string, feature: FeatureType): Promise<{ allowed: boolean; message?: string }> {
    const supabase = await createClient();

    try {
        // 1. Get Subscription & Plan
        // We join manually to avoid issues if FK is missing or strict
        const { data: subscription, error: subError } = await supabase
            .from('subscriptions')
            .select('plan_id, status')
            .eq('shop_id', shopId)
            .eq('status', 'active')
            .maybeSingle();

        if (subError) throw subError;

        const planId = subscription?.plan_id || 'free';

        // 2. Get Limits from Plan
        const { data: plan, error: planError } = await supabase
            .from('plans')
            .select('limits')
            .eq('id', planId)
            .single();

        if (planError) throw planError;

        const limits = plan?.limits as any || { invoices: 50 }; // Fallback only if DB empty
        const limit = limits[feature];

        if (limit === -1 || limit === undefined) return { allowed: true }; // Unlimited (or undefined feature treated as open? No, undefined should be strict. Let's assume -1 is the only Unlimited convention)

        // Fix: If limit is undefined in JSON, default to 0 (Strict)
        const numericLimit = typeof limit === 'number' ? limit : 0;

        if (numericLimit === 0 && feature !== 'invoices') {
            // Logic for features like 'loans' where 0 means "Not Included"
            return { allowed: false, message: `Your current ${planId} plan does not include ${feature}. Upgrade to Pro.` };
        }

        // 3. Check Usage
        // Invoices: Check count for current month
        if (feature === 'invoices') {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            const { count, error: countError } = await supabase
                .from('invoices')
                .select('*', { count: 'exact', head: true })
                .eq('shop_id', shopId)
                .gte('created_at', startOfMonth);

            if (countError) {
                console.error('Error checking invoice usage:', countError);
                return { allowed: false, message: 'Unable to verify subscription limits. Please contact support.' }; // Fail Closed
            }

            if ((count || 0) >= numericLimit) {
                return { allowed: false, message: `Monthly invoice limit reached (${count}/${numericLimit}). Upgrade to Pro for unlimited invoices.` };
            }
        }

        // Add other feature checks here

        return { allowed: true };

    } catch (error) {
        console.error('Subscription Check Failed:', error);
        return { allowed: false, message: 'System error validating subscription. Please try again.' }; // Fail Closed
    }
}
