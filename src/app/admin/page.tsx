'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/supabase/provider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Building2,
    TrendingUp,
    FileText,
    Plus,
    ArrowRight,
    BarChart3,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { formatCurrency, cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/supabase/client';
import type { Shop } from '@/lib/definitions';
import { startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';

// Animation variants for staggered reveals
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export default function AdminDashboardPage() {
    const { user } = useUser();
    const router = useRouter();
    const [userShops, setUserShops] = useState<Shop[]>([]);
    const [stats, setStats] = useState({
        revenue: 0,
        invoices: 0,
        thisMonthRevenue: 0,
        lastMonthRevenue: 0,
        thisMonthOrders: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    // Fetch user shops and stats
    useEffect(() => {
        async function fetchData() {
            if (!user?.uid) {
                setIsLoading(false);
                return;
            }

            try {
                // Fetch user's shops
                const { data: roles, error: rolesError } = await supabase
                    .from('user_shop_roles')
                    .select('shop_id, shops(*)')
                    .eq('user_id', user.uid)
                    .eq('is_active', true);

                if (rolesError) throw rolesError;

                const shops: Shop[] = (roles || [])
                    .map((role: any) => {
                        if (!role.shops) return null;
                        const shop = role.shops;
                        return {
                            id: shop.id,
                            shopName: shop.shop_name,
                            gstNumber: shop.gst_number,
                            panNumber: shop.pan_number,
                            address: shop.address,
                            state: shop.state,
                            pincode: shop.pincode,
                            phoneNumber: shop.phone_number,
                            email: shop.email,
                            logoUrl: shop.logo_url,
                            templateId: shop.template_id,
                            cgstRate: Number(shop.cgst_rate) || 1.5,
                            sgstRate: Number(shop.sgst_rate) || 1.5,
                            isActive: shop.is_active,
                            createdBy: shop.created_by,
                            createdAt: shop.created_at,
                            updatedAt: shop.updated_at,
                        };
                    })
                    .filter(Boolean) as Shop[];

                setUserShops(shops);

                const shopIds = shops.map(shop => shop.id);

                if (shopIds.length === 0) {
                    setStats({ revenue: 0, invoices: 0, thisMonthRevenue: 0, lastMonthRevenue: 0, thisMonthOrders: 0 });
                    return;
                }

                // Fetch invoices
                const { data: invoices, error: invoicesError } = await supabase
                    .from('invoices')
                    .select('grand_total, invoice_date')
                    .in('shop_id', shopIds);

                if (invoicesError) throw invoicesError;

                const totalRevenue = invoices?.reduce((sum, inv) => sum + (Number(inv.grand_total) || 0), 0) || 0;
                const totalInvoices = invoices?.length || 0;

                // Calculate Monthly Stats
                const now = new Date();
                const currentMonthStart = startOfMonth(now);
                const currentMonthEnd = endOfMonth(now);
                const lastMonthStart = startOfMonth(subMonths(now, 1));
                const lastMonthEnd = endOfMonth(subMonths(now, 1));

                const thisMonthInvoices = invoices?.filter(inv =>
                    isWithinInterval(new Date(inv.invoice_date), { start: currentMonthStart, end: currentMonthEnd })
                ) || [];

                const lastMonthInvoices = invoices?.filter(inv =>
                    isWithinInterval(new Date(inv.invoice_date), { start: lastMonthStart, end: lastMonthEnd })
                ) || [];

                const thisMonthRevenue = thisMonthInvoices.reduce((sum, inv) => sum + (Number(inv.grand_total) || 0), 0);
                const lastMonthRevenue = lastMonthInvoices.reduce((sum, inv) => sum + (Number(inv.grand_total) || 0), 0);

                setStats({
                    revenue: totalRevenue,
                    invoices: totalInvoices,
                    thisMonthRevenue,
                    lastMonthRevenue,
                    thisMonthOrders: thisMonthInvoices.length,
                });
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, [user?.uid]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" />
                <div className="flex gap-3 overflow-hidden">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-[280px] rounded-2xl flex-shrink-0" />)}
                </div>
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
                </div>
            </div>
        );
    }

    const totalShops = userShops.length;
    const revenueGrowth = stats.lastMonthRevenue > 0
        ? ((stats.thisMonthRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue) * 100
        : 0;

    return (
        <motion.div
            className="space-y-6 lg:space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold font-heading text-foreground">
                        Welcome back
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Here's what's happening across your {totalShops} shop{totalShops !== 1 ? 's' : ''}
                    </p>
                </div>
                <Button
                    onClick={() => router.push('/onboarding/shop-setup')}
                    className="sm:w-auto bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-600 hover:to-amber-600 text-white shadow-lg shadow-gold-500/25 h-11 rounded-xl font-medium"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Shop
                </Button>
            </motion.div>

            {/* Shop Quick Access - Right below header */}
            <motion.div variants={itemVariants}>
                <div className="flex items-center gap-2 mb-3">
                    <h2 className="text-base font-semibold text-foreground">Your Shops</h2>
                    <span className="text-xs text-muted-foreground bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-full">
                        {totalShops}
                    </span>
                </div>

                {/* Horizontal scroll on mobile, grid on desktop */}
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-3 xl:grid-cols-4 lg:overflow-visible scrollbar-hide">
                    {userShops.map((shop) => (
                        <motion.button
                            key={shop.id}
                            onClick={() => router.push(`/shop/${shop.id}/dashboard`)}
                            className="flex-shrink-0 w-[240px] lg:w-auto text-left p-4 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-gold-50 dark:hover:bg-gold-500/10 transition-all duration-300 group active:scale-[0.98]"
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gold-400 to-amber-500 flex items-center justify-center text-white flex-shrink-0">
                                    <Building2 className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-foreground group-hover:text-gold-600 dark:group-hover:text-gold-400 transition-colors truncate">
                                        {shop.shopName}
                                    </h3>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {shop.state || 'Open Dashboard'}
                                    </p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-gold-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                            </div>
                        </motion.button>
                    ))}

                    {/* Add New Shop */}
                    <motion.button
                        onClick={() => router.push('/onboarding/shop-setup')}
                        className="flex-shrink-0 w-[240px] lg:w-auto flex items-center gap-3 p-4 rounded-2xl bg-transparent hover:bg-gold-50/50 dark:hover:bg-gold-950/10 border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-gold-400 transition-all duration-300 group"
                        whileHover={{ y: -2 }}
                    >
                        <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center group-hover:bg-gold-500/20 transition-colors">
                            <Plus className="h-5 w-5 text-slate-400 group-hover:text-gold-500" />
                        </div>
                        <span className="font-medium text-muted-foreground group-hover:text-gold-600 dark:group-hover:text-gold-400">
                            Add Shop
                        </span>
                    </motion.button>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <motion.div variants={itemVariants} className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {/* This Month Revenue - Featured */}
                <Card className="col-span-2 lg:col-span-1 relative overflow-hidden bg-gradient-to-br from-[#0a0a0b] via-[#111113] to-[#0a0a0b] dark:from-gold-950/50 dark:via-gold-900/30 dark:to-[#0a0a0b] text-white border border-gold-500/20 dark:border-gold-500/30 shadow-2xl rounded-2xl">
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-gold-500/30 rounded-full blur-3xl" />
                    <CardContent className="relative p-5">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-semibold text-gold-400/80 uppercase tracking-wider">This Month</span>
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gold-400 to-amber-500 flex items-center justify-center shadow-lg shadow-gold-500/30">
                                <TrendingUp className="h-5 w-5 text-white" />
                            </div>
                        </div>
                        <div className="text-3xl sm:text-4xl font-bold tracking-tight">{formatCurrency(stats.thisMonthRevenue)}</div>
                        <div className="flex items-center gap-2 mt-2">
                            <span className={cn(
                                "text-xs font-medium px-2 py-0.5 rounded-full",
                                revenueGrowth >= 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                            )}>
                                {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%
                            </span>
                            <span className="text-xs text-slate-400">vs last month</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Lifetime Revenue */}
                <Card className="rounded-2xl border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:shadow-lg transition-shadow">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <BarChart3 className="h-5 w-5 text-emerald-500" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-foreground">{formatCurrency(stats.revenue)}</div>
                        <p className="text-xs text-muted-foreground mt-1 font-medium">Lifetime Revenue</p>
                    </CardContent>
                </Card>

                {/* Total Invoices */}
                <Card className="rounded-2xl border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:shadow-lg transition-shadow">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-blue-500" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-foreground">{stats.invoices.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1 font-medium">Total Invoices</p>
                    </CardContent>
                </Card>

                {/* Active Shops */}
                <Card className="rounded-2xl border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:shadow-lg transition-shadow">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-purple-500" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-foreground">{totalShops}</div>
                        <p className="text-xs text-muted-foreground mt-1 font-medium">Active Shops</p>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}
