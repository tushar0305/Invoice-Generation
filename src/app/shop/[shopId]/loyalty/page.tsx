'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { 
    Crown, 
    Settings, 
    Users, 
    TrendingUp, 
    Gift, 
    Zap, 
    History, 
    Sparkles,
    ArrowRight,
    Trophy,
    Search
} from 'lucide-react';

import { supabase } from '@/supabase/client';
import { useActiveShop } from '@/hooks/use-active-shop';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

import { LoyaltyHeader } from '@/components/loyalty/loyalty-header';
import { LoyaltyDashboard } from '@/components/loyalty/loyalty-dashboard';

export default function LoyaltyProgramPage() {
    const router = useRouter();
    const { activeShop, isLoading: shopLoading } = useActiveShop();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    
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

                // 2. Fetch Recent Logs (Limit 10)
                const { data: recent } = await supabase
                    .from('customer_loyalty_logs')
                    .select('points_change, created_at, customer:customers(name, phone)')
                    .eq('shop_id', activeShop.id)
                    .order('created_at', { ascending: false })
                    .limit(10);

                // 3. Fetch Chart Data (Last 30 Days)
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                const { data: chartLogs } = await supabase
                    .from('customer_loyalty_logs')
                    .select('points_change, created_at')
                    .eq('shop_id', activeShop.id)
                    .gte('created_at', thirtyDaysAgo.toISOString())
                    .order('created_at', { ascending: true });

                // 4. Fetch Total Stats
                const { data: allPoints } = await supabase
                    .from('customer_loyalty_logs')
                    .select('points_change')
                    .eq('shop_id', activeShop.id);

                let issued = 0;
                let redeemed = 0;

                if (allPoints) {
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
                    .limit(10);

                // 6. Fetch Total Customer Count
                const { count } = await supabase
                    .from('customers')
                    .select('*', { count: 'exact', head: true })
                    .eq('shop_id', activeShop.id)
                    .gt('loyalty_points', 0);

                // 7. Calculate Liability
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
                setAllLogs(chartLogs || []);
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
            <div className="min-h-screen bg-background">
                <LoyaltyHeader shopName="Loading..." onNewReward={() => {}} />
                <div className="max-w-5xl mx-auto px-4 md:px-8 mt-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
                    </div>
                    <Skeleton className="h-96 rounded-xl" />
                </div>
            </div>
        );
    }

    if (!settings?.is_enabled) {
        return (
            <div className="min-h-screen bg-background pb-24">
                <LoyaltyHeader shopName={activeShop?.shopName || 'My Shop'} onNewReward={() => {}} />
                <div className="relative p-4 md:p-8 flex items-center justify-center min-h-[80vh]">
                    <Card className="max-w-lg w-full border-0 shadow-2xl bg-card/70 backdrop-blur-xl overflow-hidden ring-1 ring-border/50">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 pointer-events-none" />
                        <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
                            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary to-primary/80 shadow-xl shadow-primary/20 flex items-center justify-center">
                                <Crown className="h-10 w-10 text-primary-foreground" />
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-2xl font-bold tracking-tight">Loyalty Program</h1>
                                <p className="text-muted-foreground leading-relaxed">
                                    Start rewarding your customers today. Enable the loyalty program to track points, set redemption rules, and boost retention.
                                </p>
                            </div>
                            <Button asChild size="lg" className="w-full rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20">
                                <Link href={`/shop/${activeShop?.id}/settings`}>
                                    Enable Loyalty Program
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-24 md:pb-8 transition-colors duration-300">
            
            {/* HEADER */}
            <LoyaltyHeader 
                shopName={activeShop?.shopName || 'My Shop'} 
                onNewReward={() => router.push(`/shop/${activeShop?.id}/invoices/new`)} 
            />

            {/* MAIN CONTENT */}
            <div className="max-w-5xl mx-auto px-4 md:px-8 -mt-8 relative z-10 space-y-8">

                {/* TABS */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <div className="flex justify-center md:justify-start">
                        <TabsList className="h-auto p-1.5 bg-background/80 backdrop-blur-xl border border-border shadow-xl shadow-black/5 rounded-full grid grid-cols-3 w-full md:w-auto md:inline-flex md:h-14">
                            <TabsTrigger
                                value="overview"
                                className="rounded-full px-6 md:px-8 py-3 md:py-0 h-full text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all capitalize"
                            >
                                Overview
                            </TabsTrigger>
                            <TabsTrigger
                                value="customers"
                                className="rounded-full px-6 md:px-8 py-3 md:py-0 h-full text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all capitalize"
                            >
                                Top Customers
                            </TabsTrigger>
                            <TabsTrigger
                                value="settings"
                                className="rounded-full px-6 md:px-8 py-3 md:py-0 h-full text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all capitalize"
                            >
                                Settings
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* OVERVIEW TAB */}
                    <TabsContent value="overview" className="space-y-6 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <LoyaltyDashboard
                            shopId={activeShop?.id || ''}
                            stats={stats}
                            recentLogs={recentLogs}
                            topCustomers={topCustomers}
                            settings={settings}
                            allLogs={allLogs}
                        />
                    </TabsContent>

                    {/* CUSTOMERS TAB */}
                    <TabsContent value="customers" className="space-y-6 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="border-none shadow-xl bg-card/50 backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle>Top Loyal Customers</CardTitle>
                                <CardDescription>Customers with the highest accumulated points</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-border/50">
                                    {topCustomers.map((customer, i) => (
                                        <div key={customer.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "h-10 w-10 rounded-full flex items-center justify-center font-bold text-white shadow-md",
                                                    i === 0 ? "bg-yellow-500" : i === 1 ? "bg-gray-400" : i === 2 ? "bg-amber-700" : "bg-purple-500/50"
                                                )}>
                                                    {i < 3 ? <Trophy className="h-5 w-5" /> : i + 1}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground">{customer.name}</p>
                                                    <p className="text-xs text-muted-foreground">{customer.phone}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-purple-600 dark:text-purple-400">{customer.loyalty_points} pts</p>
                                                <p className="text-xs text-muted-foreground">Lifetime Value</p>
                                            </div>
                                        </div>
                                    ))}
                                    {topCustomers.length === 0 && (
                                        <div className="p-8 text-center text-muted-foreground">
                                            No customers found with loyalty points yet.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* SETTINGS TAB */}
                    <TabsContent value="settings" className="space-y-6 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="border-none shadow-xl bg-card/50 backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle>Program Configuration</CardTitle>
                                <CardDescription>Manage your loyalty program rules</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                                        <p className="text-sm font-medium text-muted-foreground mb-1">Points per Currency</p>
                                        <p className="text-2xl font-bold">{settings?.points_per_currency || 1} Point / ₹1</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                                        <p className="text-sm font-medium text-muted-foreground mb-1">Redemption Value</p>
                                        <p className="text-2xl font-bold">1 Point = ₹{settings?.redemption_conversion_rate || 1}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                                        <p className="text-sm font-medium text-muted-foreground mb-1">Minimum Redemption</p>
                                        <p className="text-2xl font-bold">{settings?.min_redemption_points || 0} Points</p>
                                    </div>
                                </div>
                                <div className="pt-4 flex justify-end">
                                    <Button asChild variant="outline" className="rounded-full">
                                        <Link href={`/shop/${activeShop?.id}/settings`}>
                                            <Settings className="mr-2 h-4 w-4" />
                                            Edit Settings
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
