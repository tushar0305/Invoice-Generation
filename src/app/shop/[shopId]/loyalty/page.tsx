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
                <div className="p-4 rounded-full bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                    <Crown className="h-12 w-12" />
                </div>
                <h1 className="text-3xl font-bold">Loyalty Program Not Enabled</h1>
                <p className="text-muted-foreground max-w-md">
                    Start rewarding your customers today. Enable the loyalty program in settings to track points, set redemption rules, and boost customer retention.
                </p>
                <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Link href={`/shop/${activeShop?.id}/settings`}>
                        <Settings className="mr-2 h-4 w-4" />
                        Configure Settings
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <MotionWrapper className="p-6 space-y-8 max-w-7xl mx-auto pb-24">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                        Loyalty Dashboard
                    </h1>
                    <p className="text-muted-foreground">Track points, redemptions, and customer engagement</p>
                </div>
                <Button asChild variant="outline">
                    <Link href={`/shop/${activeShop?.id}/settings`}>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                    </Link>
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-purple-100 dark:border-purple-900/20 bg-purple-50/50 dark:bg-purple-900/10">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">Lifetime</span>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.totalIssued.toLocaleString()}</h3>
                            <p className="text-sm text-muted-foreground">Total Points Issued</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-pink-100 dark:border-pink-900/20 bg-pink-50/50 dark:bg-pink-900/10">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg text-pink-600">
                                <Gift className="h-5 w-5" />
                            </div>
                            <span className="text-xs font-medium text-pink-600 bg-pink-100 px-2 py-1 rounded-full">Redeemed</span>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-2xl font-bold text-pink-700 dark:text-pink-300">{stats.totalRedeemed.toLocaleString()}</h3>
                            <p className="text-sm text-muted-foreground">Total Points Redeemed</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-amber-100 dark:border-amber-900/20 bg-amber-50/50 dark:bg-amber-900/10">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600">
                                <Crown className="h-5 w-5" />
                            </div>
                            <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded-full">Active</span>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats.totalCustomers.toLocaleString()}</h3>
                            <p className="text-sm text-muted-foreground">Customers with Points</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-blue-100 dark:border-blue-900/20 bg-blue-50/50 dark:bg-blue-900/10">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
                                <Zap className="h-5 w-5" />
                            </div>
                            <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Liability</span>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(stats.liability)}</h3>
                            <p className="text-sm text-muted-foreground">Outstanding Value</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <History className="h-5 w-5 text-muted-foreground" />
                            Recent Activity
                        </CardTitle>
                        <CardDescription>Latest point transactions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentLogs.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">No recent activity</div>
                            ) : (
                                recentLogs.map((log, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "p-2 rounded-full",
                                                log.points_change > 0 ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                                            )}>
                                                {log.points_change > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                                            </div>
                                            <div>
                                                <p className="font-medium">{log.customer?.name || 'Unknown Customer'}</p>
                                                <p className="text-xs text-muted-foreground">{format(new Date(log.created_at), 'MMM d, h:mm a')}</p>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "font-bold",
                                            log.points_change > 0 ? "text-emerald-600" : "text-rose-600"
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
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Star className="h-5 w-5 text-amber-500" />
                            Top Loyalists
                        </CardTitle>
                        <CardDescription>Customers with most points</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topCustomers.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">No data yet</div>
                            ) : (
                                topCustomers.map((customer, i) => (
                                    <div key={customer.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-bold text-sm">
                                                {i + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{customer.name}</p>
                                                <p className="text-xs text-muted-foreground">{customer.phone}</p>
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
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
    );
}

