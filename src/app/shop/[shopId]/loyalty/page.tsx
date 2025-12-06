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
                    setAllLogs(logs); // Store all logs for chart calculation
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
                <div className="p-4 rounded-full bg-purple-100 text-purple-600 shadow-xl shadow-purple-500/10">
                    <Crown className="h-12 w-12" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Loyalty Program Not Enabled</h1>
                <p className="text-slate-500 max-w-md text-lg leading-relaxed">
                    Start rewarding your customers today. Enable the loyalty program in settings to track points, set redemption rules, and boost customer retention.
                </p>
                <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/20 border-none transition-all hover:scale-105">
                    <Link href={`/shop/${activeShop?.id}/settings`}>
                        <Settings className="mr-2 h-4 w-4" />
                        Configure Settings
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <MotionWrapper className="p-6 max-w-7xl mx-auto pb-24 min-h-screen bg-muted/10">
            {/* Dashboard View */}
            <div>
                <LoyaltyDashboard
                    shopId={activeShop?.id || ''}
                    stats={stats}
                    recentLogs={recentLogs}
                    topCustomers={topCustomers}
                    settings={settings}
                    allLogs={allLogs}
                />
            </div>
        </MotionWrapper>
    );
}

