import { useEffect, useState } from 'react';
import { Plan, ShopSubscription, ShopUsage } from '@/lib/subscription-types';
import { getShopSubscription, checkLimit } from '@/lib/subscription-service';

export function useSubscription(shopId: string) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{ plan: Plan; subscription: ShopSubscription | null; usage: ShopUsage } | null>(null);

    useEffect(() => {
        if (!shopId) return;

        async function fetch() {
            try {
                const res = await getShopSubscription(shopId);
                setData(res as any);
            } catch (e) {
                console.error("Failed to load subscription", e);
            } finally {
                setLoading(false);
            }
        }
        fetch();
    }, [shopId]);

    const canAccessFeature = (feature: keyof Plan['features']) => {
        if (!data) return false;
        return !!data.plan.features[feature];
    };

    const isLimitReached = (metric: keyof Plan['limits']) => {
        if (!data) return false;
        const limit = data.plan.limits[metric];

        let used = 0;
        if (metric === 'invoices') used = data.usage.invoices_created;
        if (metric === 'customers') used = data.usage.customers_added;
        if (metric === 'staff') used = data.usage.staff_seats_occupied;
        if (metric === 'ai_tokens') used = data.usage.ai_tokens_used;

        if (limit === -1) return false;
        return used >= limit;
    };

    return {
        loading,
        plan: data?.plan,
        subscription: data?.subscription,
        usage: data?.usage,
        canAccessFeature,
        isLimitReached
    };
}
