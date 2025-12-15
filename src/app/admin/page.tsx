'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/supabase/provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Building2,
    TrendingUp,
    FileText,
    Plus,
    ArrowRight,
    Settings,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/supabase/client';
import type { Shop } from '@/lib/definitions';
import { BusinessHealthWidget } from '@/components/dashboard/business-health';
import { startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';

export default function AdminDashboardPage() {
    const { user } = useUser();
    const router = useRouter();
    const [userShops, setUserShops] = useState<Shop[]>([]);
    const [stats, setStats] = useState({
        revenue: 0,
        invoices: 0,
        thisMonthRevenue: 0,
        lastMonthRevenue: 0,
        thisMonthOrders: 0
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

                // Fetch total revenue across all shops
                const shopIds = shops.map(shop => shop.id);

                if (shopIds.length === 0) {
                    setStats({ revenue: 0, invoices: 0, thisMonthRevenue: 0, lastMonthRevenue: 0, thisMonthOrders: 0 });
                    return;
                }

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
                    thisMonthOrders: thisMonthInvoices.length
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
            <div className="space-y-8 p-6 md:p-8">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                </div>
                <Skeleton className="h-[400px]" />
            </div>
        );
    }

    // Calculate aggregated stats
    const totalShops = userShops.length;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-heading bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                        Global Admin Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Overview of all your jewellery shops
                    </p>
                </div>
                <Button
                    onClick={() => router.push('/onboarding/shop-setup')}
                    className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white shadow-lg shadow-gold-500/20"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Shop
                </Button>
            </div>

            {/* Founder Widgets */}
            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-1">
                    <BusinessHealthWidget
                        totalRevenue={stats.thisMonthRevenue}
                        totalOrders={stats.thisMonthOrders}
                        revenueGrowth={stats.lastMonthRevenue > 0 ? ((stats.thisMonthRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue) * 100 : 0}
                        returningRate={30} // Placeholder for global aggregate, as we don't have this data easily available per shop in this view yet
                    />
                </div>

                {/* Global Stats Cards (Condensed) */}
                <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
                    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-xl">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-300">Lifetime Revenue</CardTitle>
                            <TrendingUp className="h-4 w-4 text-gold-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.revenue)}</div>
                            <p className="text-xs text-slate-400 mt-1">
                                Across {totalShops} shops
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.invoices}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Lifetime generated
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="md:col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Shops</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalShops}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Locations managing business
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Shop List */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Your Shops</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {userShops.map((shop, index) => (
                        <motion.div
                            key={shop.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="group hover:shadow-lg transition-all duration-300 border-slate-200 dark:border-slate-800 overflow-hidden">
                                <CardHeader className="pb-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-gold-100 dark:bg-gold-900/20 flex items-center justify-center text-gold-600 dark:text-gold-400">
                                                <Building2 className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">{shop.shopName}</CardTitle>
                                                <CardDescription className="line-clamp-1">{shop.address || 'No address set'}</CardDescription>
                                            </div>
                                        </div>
                                        <Badge variant={shop.isActive ? "default" : "secondary"} className={shop.isActive ? "bg-green-500/10 text-green-600 hover:bg-green-500/20" : ""}>
                                            {shop.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div>
                                            <p className="text-xs text-muted-foreground">GSTIN</p>
                                            <p className="font-medium text-sm">{shop.gstNumber || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Role</p>
                                            <p className="font-medium text-sm capitalize">Owner</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            className="flex-1 bg-slate-900 text-white hover:bg-slate-800"
                                            onClick={() => router.push(`/shop/${shop.id}/dashboard`)}
                                        >
                                            Dashboard
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" size="icon">
                                            <Settings className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}

                    {/* Add New Shop Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: userShops.length * 0.1 }}
                    >
                        <button
                            onClick={() => router.push('/onboarding/shop-setup')}
                            className="w-full h-full min-h-[200px] flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-gold-500/50 hover:bg-gold-50/50 dark:hover:bg-gold-950/10 transition-all duration-300 group"
                        >
                            <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <Plus className="h-6 w-6 text-slate-400 group-hover:text-gold-500" />
                            </div>
                            <div className="text-center">
                                <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-gold-600 dark:group-hover:text-gold-400">Add New Shop</h3>
                                <p className="text-sm text-muted-foreground">Expand your business</p>
                            </div>
                        </button>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
