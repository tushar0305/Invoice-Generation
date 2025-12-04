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
import { MobileLoyalty } from '@/components/mobile/mobile-loyalty';

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
    const [topCustomers, setTopCustomers] = useState<any[]>([]);
    const [settings, setSettings] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!activeShop?.id) return;
            setLoading(true);

            try {
                // Fetch Settings
                const { data: settingsData } = await supabase
                    .from('shop_loyalty_settings')
                    .select('*')
                    .eq('shop_id', activeShop.id)
                    .single();
                
                setSettings(settingsData);

                // Fetch Logs for Stats
                const { data: logs } = await supabase
                    .from('customer_loyalty_logs')
                    .select('points_change, created_at, customer:customers(name)')
                    .eq('shop_id', activeShop.id)
                    .order('created_at', { ascending: false });

                if (logs) {
                    const issued = logs.filter(l => l.points_change > 0).reduce((acc, l) => acc + l.points_change, 0);
                    const redeemed = logs.filter(l => l.points_change < 0).reduce((acc, l) => acc + Math.abs(l.points_change), 0);
                    
                    // Fetch Customers for Liability
                    const { data: customers } = await supabase
                        .from('customers')
                        .select('id, name, loyalty_points, phone')
                        .eq('shop_id', activeShop.id)
                        .gt('loyalty_points', 0)
                        .order('loyalty_points', { ascending: false })
                        .limit(5);
                    
                    const { count } = await supabase
                        .from('customers')
                        .select('*', { count: 'exact', head: true })
                        .eq('shop_id', activeShop.id)
                        .gt('loyalty_points', 0);

                    // Calculate Liability
                    const conversionRate = settingsData?.redemption_conversion_rate || 1;
                    
                    // Calculate total outstanding points from customers table
                    const { data: allCustomers } = await supabase
                        .from('customers')
                        .select('loyalty_points')
                        .eq('shop_id', activeShop.id)
                        .gt('loyalty_points', 0);
                    
                    const outstanding = allCustomers?.reduce((acc, c) => acc + (c.loyalty_points || 0), 0) || 0;

                    setStats({
                        totalIssued: issued,
                        totalRedeemed: redeemed,
                        liability: outstanding * conversionRate,
                        totalCustomers: count || 0,
                    });

                    setRecentLogs(logs.slice(0, 10));
                    setTopCustomers(customers || []);
                }

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
            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
                </div>
                <Skeleton className="h-96 rounded-xl" />
            </div>
        );
    }

    if (!settings?.is_enabled) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4 space-y-6">
                <div className="p-4 rounded-full bg-purple-500/20 text-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                    <Crown className="h-12 w-12" />
                </div>
                <h1 className="text-3xl font-bold text-white glow-text-sm">Loyalty Program Not Enabled</h1>
                <p className="text-gray-400 max-w-md">
                    Start rewarding your customers today. Enable the loyalty program in settings to track points, set redemption rules, and boost customer retention.
                </p>
                <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)] border-none">
                    <Link href={`/shop/${activeShop?.id}/settings`}>
                        <Settings className="mr-2 h-4 w-4" />
                        Configure Settings
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <>
            <MobileLoyalty 
                shopId={activeShop?.id || ''} 
                stats={stats} 
                recentLogs={recentLogs} 
                topCustomers={topCustomers} 
            />
            <MotionWrapper className="hidden md:block p-6 space-y-8 max-w-7xl mx-auto pb-24">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 glow-text-sm">
                        Loyalty Dashboard
                    </h1>
                    <p className="text-muted-foreground dark:text-gray-400">Track points, redemptions, and customer engagement</p>
                </div>
                <Button asChild variant="outline" className="border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-foreground dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-foreground dark:hover:text-white">
                    <Link href={`/shop/${activeShop?.id}/settings`}>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                    </Link>
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-purple-500/20 bg-purple-500/5 backdrop-blur-md shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-600 dark:text-purple-400">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-1 rounded-full border border-purple-500/20">Lifetime</span>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 glow-text-sm">{stats.totalIssued.toLocaleString()}</h3>
                            <p className="text-sm text-purple-600/60 dark:text-purple-400/60">Total Points Issued</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-pink-500/20 bg-pink-500/5 backdrop-blur-md shadow-[0_0_15px_rgba(236,72,153,0.1)]">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-pink-500/20 rounded-lg text-pink-600 dark:text-pink-400">
                                <Gift className="h-5 w-5" />
                            </div>
                            <span className="text-xs font-medium text-pink-600 dark:text-pink-400 bg-pink-500/10 px-2 py-1 rounded-full border border-pink-500/20">Redeemed</span>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-2xl font-bold text-pink-600 dark:text-pink-400 glow-text-sm">{stats.totalRedeemed.toLocaleString()}</h3>
                            <p className="text-sm text-pink-600/60 dark:text-pink-400/60">Total Points Redeemed</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-amber-500/20 bg-amber-500/5 backdrop-blur-md shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-amber-500/20 rounded-lg text-amber-600 dark:text-amber-400">
                                <Crown className="h-5 w-5" />
                            </div>
                            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/20">Active</span>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 glow-text-sm">{stats.totalCustomers.toLocaleString()}</h3>
                            <p className="text-sm text-amber-600/60 dark:text-amber-400/60">Customers with Points</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-blue-500/20 bg-blue-500/5 backdrop-blur-md shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-600 dark:text-blue-400">
                                <Zap className="h-5 w-5" />
                            </div>
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full border border-blue-500/20">Liability</span>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 glow-text-sm">{formatCurrency(stats.liability)}</h3>
                            <p className="text-sm text-blue-600/60 dark:text-blue-400/60">Outstanding Value</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <Card className="lg:col-span-2 border-gray-200 dark:border-white/10 bg-white/50 dark:bg-card/30 backdrop-blur-md shadow-lg">
                    <CardHeader className="border-b border-gray-200 dark:border-white/10">
                        <CardTitle className="flex items-center gap-2 text-foreground dark:text-white">
                            <History className="h-5 w-5 text-primary glow-text-sm" />
                            Recent Activity
                        </CardTitle>
                        <CardDescription className="text-muted-foreground dark:text-gray-400">Latest point transactions</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            {recentLogs.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground dark:text-gray-500">No recent activity</div>
                            ) : (
                                recentLogs.map((log, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "p-2 rounded-full",
                                                log.points_change > 0 ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                                            )}>
                                                {log.points_change > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground dark:text-gray-200">{log.customer?.name || 'Unknown Customer'}</p>
                                                <p className="text-xs text-muted-foreground dark:text-gray-500">{format(new Date(log.created_at), 'MMM d, h:mm a')}</p>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "font-bold",
                                            log.points_change > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                        )}>
                                            {log.points_change > 0 ? '+' : ''}{log.points_change} pts
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Customers */}
                <Card className="border-gray-200 dark:border-white/10 bg-white/50 dark:bg-card/30 backdrop-blur-md shadow-lg">
                    <CardHeader className="border-b border-gray-200 dark:border-white/10">
                        <CardTitle className="flex items-center gap-2 text-foreground dark:text-white">
                            <Star className="h-5 w-5 text-amber-500 dark:text-amber-400 glow-text-sm" />
                            Top Loyalists
                        </CardTitle>
                        <CardDescription className="text-muted-foreground dark:text-gray-400">Customers with most points</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            {topCustomers.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground dark:text-gray-500">No data yet</div>
                            ) : (
                                topCustomers.map((customer, i) => (
                                    <div key={customer.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-sm border border-amber-500/20">
                                                {i + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm text-foreground dark:text-gray-200">{customer.name}</p>
                                                <p className="text-xs text-muted-foreground dark:text-gray-500">{customer.phone}</p>
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                                            {customer.loyalty_points} pts
                                        </Badge>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MotionWrapper>
        </>
    );
}

