'use client';

import { MotionWrapper } from '@/components/ui/motion-wrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Gift, TrendingUp, Star, Zap, Award, ArrowRight, Sparkles, Users, Heart, History, ArrowUpRight, ArrowDownLeft, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn, formatCurrency } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useActiveShop } from '@/hooks/use-active-shop';
import { supabase } from '@/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

import { LoyaltyDashboard } from '@/components/loyalty/loyalty-dashboard';

export default function LoyaltyProgramPage() {
    const router = useRouter();
    const { activeShop, isLoading: shopLoading } = useActiveShop();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalIssued: 0,
        totalRedeemed: 0,
        liability: 0,
        totalCustomers: 0,
    });
    const [recentLogs, setRecentLogs] = useState<any[]>([]);
    const [allLogs, setAllLogs] = useState<any[]>([]);
    const [topCustomers, setTopCustomers] = useState<any[]>([]);
    const [settings, setSettings] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!activeShop?.id) return;
            setLoading(true);

            try {
                // 1. Fetch Settings
                const { data: settingsData } = await supabase
                    .from('shop_loyalty_settings')
                    .select('*')
                    .eq('shop_id', activeShop.id)
                    .single();

                setSettings(settingsData);

                // 2. Fetch Recent Logs (Limit 10) - For Activity Feed
                const { data: recent } = await supabase
                    .from('customer_loyalty_logs')
                    .select('points_change, created_at, customer:customers(name)')
                    .eq('shop_id', activeShop.id)
                    .order('created_at', { ascending: false })
                    .limit(10);

                // 3. Fetch Chart Data (Last 30 Days only) - Optimized
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                const { data: chartLogs } = await supabase
                    .from('customer_loyalty_logs')
                    .select('points_change, created_at')
                    .eq('shop_id', activeShop.id)
                    .gte('created_at', thirtyDaysAgo.toISOString())
                    .order('created_at', { ascending: true });

                // 4. Fetch Total Stats (All Time) - Optimized to fetch only points_change
                // Note: For very large datasets, this should be replaced with an RPC call
                const { data: allPoints } = await supabase
                    .from('customer_loyalty_logs')
                    .select('points_change')
                    .eq('shop_id', activeShop.id);

                let issued = 0;
                let redeemed = 0;

                if (allPoints) {
                    // Calculate totals in a single pass
                    for (const log of allPoints) {
                        if (log.points_change > 0) {
                            issued += log.points_change;
                        } else {
                            redeemed += Math.abs(log.points_change);
                        }
                    }
                }

                // 5. Fetch Top Customers
                const { data: customers } = await supabase
                    .from('customers')
                    .select('id, name, loyalty_points, phone')
                    .eq('shop_id', activeShop.id)
                    .gt('loyalty_points', 0)
                    .order('loyalty_points', { ascending: false })
                    .limit(5);

                // 6. Fetch Total Customer Count
                const { count } = await supabase
                    .from('customers')
                    .select('*', { count: 'exact', head: true })
                    .eq('shop_id', activeShop.id)
                    .gt('loyalty_points', 0);

                // 7. Calculate Liability (Sum of all points)
                const { data: allCustomerPoints } = await supabase
                    .from('customers')
                    .select('loyalty_points')
                    .eq('shop_id', activeShop.id)
                    .gt('loyalty_points', 0);

                const outstanding = allCustomerPoints?.reduce((acc, c) => acc + (c.loyalty_points || 0), 0) || 0;
                const conversionRate = settingsData?.redemption_conversion_rate || 1;

                setStats({
                    totalIssued: issued,
                    totalRedeemed: redeemed,
                    liability: outstanding * conversionRate,
                    totalCustomers: count || 0,
                });

                setRecentLogs(recent || []);
                setAllLogs(chartLogs || []); // Pass only chart logs to dashboard to prevent freezing
                setTopCustomers(customers || []);

            } catch (error) {
                console.error("Error fetching loyalty data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [activeShop?.id]);

    if (shopLoading || loading) {
        return (
            <div className="min-h-screen bg-background p-6 space-y-6 max-w-7xl mx-auto pt-24">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
                </div>
                <Skeleton className="h-96 rounded-xl" />
            </div>
        );
    }

    if (!settings?.is_enabled) {
        return (
            <div className="min-h-screen bg-background pb-24">
                {/* Header Context for Empty State */}
                <div className="relative overflow-hidden bg-gradient-to-b from-muted/50 to-background border-b border-border h-[40vh] flex items-center justify-center">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
                </div>

                <div className="-mt-32 relative z-20 max-w-lg mx-auto text-center px-4">
                    <Card className="border-border/50 shadow-2xl shadow-primary/10 bg-card/60 backdrop-blur-xl p-8">
                        <div className="flex flex-col items-center space-y-6">
                            <div className="p-4 rounded-full bg-primary/10 text-primary shadow-xl shadow-primary/20 ring-1 ring-primary/20">
                                <Crown className="h-10 w-10 md:h-12 md:w-12" />
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Loyalty Program Not Enabled</h1>
                                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                                    Start rewarding your customers today. Enable the loyalty program to track points, set redemption rules, and boost retention.
                                </p>
                            </div>
                            <Button asChild size="lg" className="rounded-full px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg shadow-primary/25 border-none transition-all hover:scale-105">
                                <Link href={`/shop/${activeShop?.id}/settings`}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    Configure Settings
                                </Link>
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* --- HEADER SECTION (Strictly Matches Analytics/Catalogue) --- */}
            <div className="relative overflow-hidden bg-gradient-to-b from-muted/50 to-background border-b border-border transition-colors duration-300 pb-24 pt-10 md:pt-14 md:pb-32">
                {/* Abstract Background Elements */}
                <div className="absolute top-0 right-0 w-[250px] h-[250px] md:w-[500px] md:h-[500px] bg-primary/5 rounded-full blur-[80px] md:blur-[120px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[150px] h-[150px] md:w-[300px] md:h-[300px] bg-primary/5 rounded-full blur-[60px] md:blur-[100px] translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8">

                        {/* Brand Info */}
                        <div className="space-y-4 max-w-full md:max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 backdrop-blur-md text-xs font-medium text-amber-600 dark:text-amber-400">
                                <Crown className="h-3 w-3" />
                                <span>Customer Retention</span>
                            </div>

                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-foreground to-amber-500 dark:from-amber-400 dark:via-foreground dark:to-amber-500">
                                    Loyalty Program
                                </span>
                            </h1>

                            <p className="text-muted-foreground max-w-lg text-sm md:text-base leading-relaxed">
                                Manage reward points, track redemptions, and recognize your top customers.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <Button asChild variant="outline" className="rounded-full bg-card/50 backdrop-blur-sm border-border shadow-sm hover:bg-muted font-medium">
                                <Link href={`/shop/${activeShop?.id}/settings`}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    Rules
                                </Link>
                            </Button>
                            <Button asChild className="rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all">
                                <Link href={`/shop/${activeShop?.id}/invoices/new`}>
                                    New Invoice
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- CONTENT CONTAINER (Overlapping) --- */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-20 relative z-20">
                <LoyaltyDashboard
                    shopId={activeShop?.id || ''}
                    stats={stats}
                    recentLogs={recentLogs}
                    topCustomers={topCustomers}
                    settings={settings}
                    allLogs={allLogs}
                />
            </div>
        </div>
    );
}
