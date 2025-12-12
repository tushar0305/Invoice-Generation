import { getServerShopSubscription } from './server/subscription';
import { PlanFeatures, PlanLimits } from './subscription-types';

export type FeatureKey = keyof PlanFeatures;
export type LimitKey = keyof PlanLimits;

export async function checkFeatureAccess(shopId: string, feature: FeatureKey): Promise<boolean> {
    const { plan } = await getServerShopSubscription(shopId);
    return !!plan.features[feature];
}

export async function checkUsageLimit(shopId: string, limitKey: LimitKey, additionalUsage: number = 0): Promise<{ allowed: boolean; limit: number; used: number }> {
    const { plan, usage } = await getServerShopSubscription(shopId);

    const limit = plan.limits[limitKey];
    // Map usage key from limit key (e.g., 'invoices' -> 'invoices_created')
    // This mapping needs to be robust. 
    // PlanLimits: invoices, customers, staff, ai_tokens
    // ShopUsage: invoices_created, customers_added, staff_seats_occupied, ai_tokens_used

    let used = 0;
    if (limitKey === 'invoices') used = usage.invoices_created;
    if (limitKey === 'customers') used = usage.customers_added;
    if (limitKey === 'staff') used = usage.staff_seats_occupied;
    if (limitKey === 'ai_tokens') used = usage.ai_tokens_used;

    if (limit === -1) {
        return { allowed: true, limit: -1, used };
    }

    return {
        allowed: (used + additionalUsage) <= limit,
        limit,
        used
    };
}
