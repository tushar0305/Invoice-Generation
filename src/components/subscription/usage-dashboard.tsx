'use client';

import { useEffect, useState } from 'react';
import { Plan, ShopSubscription, ShopUsage } from '@/lib/subscription-types';
import { getShopSubscription } from '@/lib/subscription-service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, Database, Users, FileText, Zap, CircuitBoard } from 'lucide-react';
import { cn } from '@/lib/utils';

export function UsageDashboard({ shopId }: { shopId: string }) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{ plan: Plan; subscription: ShopSubscription | null; usage: ShopUsage } | null>(null);

    useEffect(() => {
        async function fetchUsage() {
            setLoading(true);
            try {
                const res = await getShopSubscription(shopId);
                setData(res as any);
            } catch (error) {
                console.error("Failed to load usage", error);
            } finally {
                setLoading(false);
            }
        }
        if (shopId) fetchUsage();
    }, [shopId]);

    if (loading) return <div className="h-40 flex items-center justify-center border rounded-xl bg-slate-50/50"><Loader2 className="animate-spin text-slate-400" /></div>;
    if (!data) return <div className="p-4 text-red-500 bg-red-50 border border-red-200 rounded-lg">Failed to load subscription data.</div>;

    const { plan, usage } = data;

    // Helper to calculate percentage
    const getPercent = (used: number, limit: number) => {
        if (limit === -1) return 0; // Unlimited
        return Math.min(100, Math.round((used / limit) * 100));
    };

    const UsageItem = ({
        label,
        icon: Icon,
        used,
        limit,
        format = (v: number) => v.toString(),
        colorClass = "bg-blue-500"
    }: {
        label: string;
        icon: any;
        used: number;
        limit: number;
        format?: (v: number) => string;
        colorClass?: string;
    }) => {
        const percent = getPercent(used, limit);
        const isUnlimited = limit === -1;
        const isCritical = !isUnlimited && percent >= 90;
        const isWarning = !isUnlimited && percent >= 75;

        const effectiveColor = isUnlimited ? "bg-emerald-500" : isCritical ? "bg-red-500" : isWarning ? "bg-amber-500" : colorClass;
        const iconColor = isUnlimited ? "text-emerald-500" : isCritical ? "text-red-500" : isWarning ? "text-amber-500" : colorClass.replace('bg-', 'text-');

        return (
            <div className="flex flex-col gap-3 p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg bg-opacity-10", effectiveColor.replace('bg-', 'bg-opacity-10 bg-'))}>
                            <Icon className={cn("w-5 h-5", iconColor)} />
                        </div>
                        <div>
                            <div className="font-semibold text-sm text-slate-700">{label}</div>
                            <div className="text-xs text-slate-500">
                                {isUnlimited ? 'Unlimited Access' : `${format(used)} / ${format(limit)} used`}
                            </div>
                        </div>
                    </div>
                    {isUnlimited && <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Pro</Badge>}
                </div>

                {!isUnlimited && (
                    <div className="space-y-1">
                        <Progress
                            value={percent}
                            className="h-2 bg-slate-100"
                            indicatorClassName={effectiveColor}
                        />
                        <div className="flex justify-end text-[10px] font-medium text-slate-400">
                            {percent}%
                        </div>
                    </div>
                )}
                {isUnlimited && (
                    <div className="h-2 w-full bg-emerald-100/50 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500/20 w-full" />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2 px-1">
                <div>
                    <h3 className="text-lg font-heading font-semibold flex items-center gap-2">
                        <CircuitBoard className="w-5 h-5 text-indigo-500" />
                        Current Usage
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Plan resets on {new Date(data.subscription?.current_period_end || new Date()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                </div>
                <Badge variant="outline" className="px-3 py-1 font-bold border-indigo-200 text-indigo-700 bg-indigo-50">
                    {plan.name} Plan
                </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <UsageItem
                    label="Monthly Invoices"
                    icon={FileText}
                    used={usage.invoices_created}
                    limit={plan.limits.invoices}
                    colorClass="bg-blue-500"
                />

                <UsageItem
                    label="Customers Added"
                    icon={Users}
                    used={usage.customers_added}
                    limit={plan.limits.customers}
                    colorClass="bg-violet-500"
                />

                <UsageItem
                    label="AI Tokens"
                    icon={Zap}
                    used={usage.ai_tokens_used}
                    limit={plan.limits.ai_tokens}
                    format={(v) => (v / 1000).toFixed(1) + 'k'}
                    colorClass="bg-amber-500"
                />
            </div>
        </div>
    );
}
