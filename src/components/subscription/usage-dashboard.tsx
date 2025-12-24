'use client';

import { useEffect, useState } from 'react';
import { Plan, ShopSubscription, ShopUsage } from '@/lib/subscription-types';
import { getShopSubscription } from '@/lib/subscription-service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, Database, Users, FileText, Zap, CircuitBoard, Infinity } from 'lucide-react';
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

    if (loading) return (
        <div className="h-64 flex flex-col items-center justify-center gap-4 rounded-3xl bg-card/40 backdrop-blur-md border border-border/50">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground animate-pulse">Loading usage stats...</p>
        </div>
    );
    
    if (!data) return (
        <div className="p-6 flex items-center gap-4 text-red-500 bg-red-500/10 border border-red-500/20 rounded-3xl backdrop-blur-sm">
            <AlertTriangle className="h-6 w-6" />
            <p className="font-medium">Failed to load subscription data.</p>
        </div>
    );

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
        colorClass = "bg-blue-500",
        gradient = "from-blue-500 to-cyan-500"
    }: {
        label: string;
        icon: any;
        used: number;
        limit: number;
        format?: (v: number) => string;
        colorClass?: string;
        gradient?: string;
    }) => {
        const percent = getPercent(used, limit);
        const isUnlimited = limit === -1;
        const isCritical = !isUnlimited && percent >= 90;
        const isWarning = !isUnlimited && percent >= 75;

        // Dynamic colors based on status
        const statusGradient = isUnlimited ? "from-emerald-500 to-teal-500" 
            : isCritical ? "from-red-500 to-orange-500" 
            : isWarning ? "from-amber-500 to-yellow-500" 
            : gradient;
            
        const statusColor = isUnlimited ? "text-emerald-500" 
            : isCritical ? "text-red-500" 
            : isWarning ? "text-amber-500" 
            : colorClass.replace('bg-', 'text-');
            
        const bgOpacity = isUnlimited ? "bg-emerald-500/10" 
            : isCritical ? "bg-red-500/10" 
            : isWarning ? "bg-amber-500/10" 
            : colorClass.replace('bg-', 'bg-') + "/10";

        return (
            <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-background/50 p-5 transition-all hover:shadow-lg hover:border-primary/20 hover:bg-background/80">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                        <div className={cn("p-2.5 rounded-xl transition-colors duration-300", bgOpacity)}>
                            <Icon className={cn("w-5 h-5", statusColor)} />
                        </div>
                        <div>
                            <div className="font-semibold text-sm text-foreground">{label}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                                {isUnlimited ? 'Unlimited Access' : `${format(used)} / ${format(limit)} used`}
                            </div>
                        </div>
                    </div>
                    {isUnlimited && (
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-0">
                            <Infinity className="h-3 w-3 mr-1" /> Pro
                        </Badge>
                    )}
                </div>

                {!isUnlimited ? (
                    <div className="space-y-2">
                        <div className="h-2.5 w-full bg-muted/50 rounded-full overflow-hidden">
                            <div 
                                className={cn("h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r", statusGradient)}
                                style={{ width: `${percent}%` }}
                            />
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className={cn("font-medium", 
                                isCritical ? "text-red-500" : isWarning ? "text-amber-500" : "text-muted-foreground"
                            )}>
                                {percent}% Used
                            </span>
                            <span className="text-muted-foreground">
                                {format(limit - used)} remaining
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="mt-2">
                        <div className="h-1.5 w-full bg-emerald-500/10 rounded-full overflow-hidden">
                            <div className="h-full w-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 animate-pulse" />
                        </div>
                        <p className="text-[10px] text-emerald-600/70 mt-2 font-medium text-right">
                            No limits applied
                        </p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="p-6 md:p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Usage Overview</h2>
                    <p className="text-muted-foreground">
                        Plan resets on {new Date(data.subscription?.current_period_end || new Date()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-border/50">
                    <CircuitBoard className="h-4 w-4" />
                    <span>Plan: <span className="font-semibold text-foreground capitalize">{plan.name}</span></span>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <UsageItem
                    label="Monthly Invoices"
                    icon={FileText}
                    used={usage.invoices_created}
                    limit={plan.limits.invoices}
                    colorClass="bg-blue-500"
                    gradient="from-blue-500 to-indigo-500"
                />
                
                <UsageItem
                    label="Customers Added"
                    icon={Users}
                    used={usage.customers_added}
                    limit={plan.limits.customers}
                    colorClass="bg-purple-500"
                    gradient="from-purple-500 to-pink-500"
                />

                <UsageItem
                    label="AI Tokens"
                    icon={Zap}
                    used={usage.ai_tokens_used}
                    limit={plan.limits.ai_tokens}
                    format={(v) => (v / 1000).toFixed(1) + 'k'}
                    colorClass="bg-amber-500"
                    gradient="from-amber-500 to-orange-500"
                />
            </div>
        </div>
    );
}
