'use client';

import { useState, useMemo } from 'react';
import { m, LazyMotion, domAnimation } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingBag,
    Users,
    CreditCard,
    Eye,
    EyeOff,
    RefreshCw,
    MoreHorizontal,
    Package
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency } from '@/lib/utils';
import type { Invoice } from '@/lib/definitions';
import { subDays, startOfDay, isWithinInterval, format } from 'date-fns';

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
};

interface InsightsClientProps {
    invoices: Invoice[];
    invoiceItems: any[];
}

export function InsightsClient({ invoices, invoiceItems }: InsightsClientProps) {
    const [timeRange, setTimeRange] = useState('30d');
    const [visibleMetrics, setVisibleMetrics] = useState<Record<string, boolean>>({
        'Total Revenue': false,
        'Total Sales': false,
        'Avg. Order Value': false,
        'Active Customers': false,
    });

    // --- Calculations ---

    const metrics = useMemo(() => {
        if (!invoices.length) return null;

        const now = new Date();
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;

        // Current period
        const currentPeriodStart = subDays(now, days);
        const currentPeriodEnd = now;

        // Previous period (same duration)
        const previousPeriodStart = subDays(currentPeriodStart, days);
        const previousPeriodEnd = currentPeriodStart;

        const paidInvoices = invoices.filter(inv => inv.status === 'paid');

        // Helper
        const inRange = (d: Date, start: Date, end: Date) => isWithinInterval(d, { start, end });

        // Current Period
        const currentPeriodPaid = paidInvoices.filter(inv => inRange(new Date(inv.invoiceDate), currentPeriodStart, currentPeriodEnd));
        const revenueCurrent = currentPeriodPaid.reduce((sum, inv) => sum + inv.grandTotal, 0);
        const salesCountCurrent = currentPeriodPaid.length;
        const newCustomersCurrent = new Set(currentPeriodPaid.map(inv => inv.customerName)).size;

        // Previous Period
        const previousPeriodPaid = paidInvoices.filter(inv => inRange(new Date(inv.invoiceDate), previousPeriodStart, previousPeriodEnd));
        const revenuePrevious = previousPeriodPaid.reduce((sum, inv) => sum + inv.grandTotal, 0);
        const salesCountPrevious = previousPeriodPaid.length;
        const newCustomersPrevious = new Set(previousPeriodPaid.map(inv => inv.customerName)).size;

        // Growth Calcs
        const calcGrowth = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return ((current - previous) / previous) * 100;
        };

        const revenueGrowth = calcGrowth(revenueCurrent, revenuePrevious);
        const salesGrowth = calcGrowth(salesCountCurrent, salesCountPrevious);
        const customersGrowth = calcGrowth(newCustomersCurrent, newCustomersPrevious);

        const avgOrderValue = salesCountCurrent > 0 ? revenueCurrent / salesCountCurrent : 0;
        const avgOrderValueLast = salesCountPrevious > 0 ? revenuePrevious / salesCountPrevious : 0;
        const aovGrowth = calcGrowth(avgOrderValue, avgOrderValueLast);

        return [
            {
                title: 'Total Revenue',
                value: formatCurrency(revenueCurrent),
                change: `${revenueGrowth > 0 ? '+' : ''}${revenueGrowth.toFixed(1)}%`,
                trend: revenueGrowth >= 0 ? 'up' : 'down',
                icon: DollarSign,
                color: 'text-emerald-400'
            },
            {
                title: 'Total Sales',
                value: salesCountCurrent.toString(),
                change: `${salesGrowth > 0 ? '+' : ''}${salesGrowth.toFixed(1)}%`,
                trend: salesGrowth >= 0 ? 'up' : 'down',
                icon: ShoppingBag,
                color: 'text-blue-400'
            },
            {
                title: 'Avg. Order Value',
                value: formatCurrency(avgOrderValue),
                change: `${aovGrowth > 0 ? '+' : ''}${aovGrowth.toFixed(1)}%`,
                trend: aovGrowth >= 0 ? 'up' : 'down',
                icon: CreditCard,
                color: 'text-purple-400'
            },
            {
                title: 'Active Customers',
                value: newCustomersCurrent.toString(),
                change: `${customersGrowth > 0 ? '+' : ''}${customersGrowth.toFixed(1)}%`,
                trend: customersGrowth >= 0 ? 'up' : 'down',
                icon: Users,
                color: 'text-pink-400'
            },
        ];
    }, [invoices, timeRange]);

    const chartData = useMemo(() => {
        if (!invoices.length) return [];

        const now = new Date();
        const paidInvoices = invoices.filter(inv => inv.status === 'paid');

        // Determine the number of days based on timeRange
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;

        const data = [];
        for (let i = days - 1; i >= 0; i--) {
            const date = subDays(now, i);
            const dayStart = startOfDay(date);
            const dayEnd = new Date(dayStart);
            dayEnd.setHours(23, 59, 59, 999);

            // Format label based on range
            const label = days === 7
                ? format(date, 'EEE')  // Mon, Tue, etc
                : days === 30
                    ? format(date, 'MMM d')  // Nov 1, Nov 2, etc
                    : format(date, 'MMM d');  // Nov 1, Nov 2, etc

            const dailyRevenue = paidInvoices
                .filter(inv => isWithinInterval(new Date(inv.invoiceDate), { start: dayStart, end: dayEnd }))
                .reduce((sum, inv) => sum + inv.grandTotal, 0);

            data.push({ name: label, value: dailyRevenue });
        }
        return data;
    }, [invoices, timeRange]);

    const categoryData = useMemo(() => {
        if (!invoiceItems.length) return [];

        const categories: Record<string, number> = {};
        invoiceItems.forEach(item => {
            // Simple categorization logic based on description or purity
            let cat = 'Other';
            const desc = (item.description || '').toLowerCase();
            const purity = (item.purity || '').toLowerCase();

            if (desc.includes('gold') || purity.includes('22k') || purity.includes('18k') || purity.includes('916')) cat = 'Gold';
            else if (desc.includes('silver') || purity.includes('925') || purity.includes('silver')) cat = 'Silver';
            else if (desc.includes('diamond')) cat = 'Diamond';
            else if (desc.includes('platinum')) cat = 'Platinum';

            categories[cat] = (categories[cat] || 0) + 1;
        });

        const total = Object.values(categories).reduce((a, b) => a + b, 0);
        const colors: Record<string, string> = {
            'Gold': '#FFD700',
            'Silver': '#C0C0C0',
            'Diamond': '#00F0FF',
            'Platinum': '#E5E4E2',
            'Other': '#888888'
        };

        return Object.entries(categories).map(([name, value]) => ({
            name,
            value: Math.round((value / total) * 100),
            color: colors[name] || '#888888'
        })).sort((a, b) => b.value - a.value);
    }, [invoiceItems]);

    const topProductsList = useMemo(() => {
        if (!invoiceItems.length) return [];

        const productStats: Record<string, { sales: number, revenue: number }> = {};

        invoiceItems.forEach(item => {
            const name = item.description || 'Unknown Item';
            if (!productStats[name]) productStats[name] = { sales: 0, revenue: 0 };

            productStats[name].sales += 1;
            // Estimate revenue from rate * weight + making (approximate as we don't have item-level total in this flattened view easily without join, using rate*netWeight for now)
            const itemTotal = (Number(item.rate) * Number(item.net_weight)) + Number(item.making);
            productStats[name].revenue += itemTotal;
        });

        return Object.entries(productStats)
            .map(([name, stats]) => ({
                name,
                sales: stats.sales,
                revenue: formatCurrency(stats.revenue),
                growth: '+0%' // Placeholder as we don't have historical item data easily
            }))
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 4);
    }, [invoiceItems]);

    const recentTxList = useMemo(() => {
        if (!invoices.length) return [];
        return invoices.slice(0, 5).map(inv => ({
            id: inv.invoiceNumber,
            customer: inv.customerName,
            amount: formatCurrency(inv.grandTotal),
            status: inv.status === 'paid' ? 'Paid' : 'Pending', // Mapping 'due' to 'Pending' for UI
            date: format(new Date(inv.invoiceDate), 'MMM dd, HH:mm')
        }));
    }, [invoices]);

    return (
        <LazyMotion features={domAnimation}>
            <div className="p-4 md:p-6 space-y-6 min-h-screen pb-24 md:pb-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <p className="text-sm md:text-base text-muted-foreground mt-1">
                            Overview of your shop's performance and growth.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.reload()}
                            className="border-border hover:bg-white/5 gap-2"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Refresh
                        </Button>
                        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/10 w-full md:w-fit overflow-x-auto">
                            {['7d', '30d', '90d'].map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={cn(
                                        "flex-1 md:flex-none px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap",
                                        timeRange === range
                                            ? "bg-primary/20 text-primary shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                                            : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                    )}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <m.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid gap-4 md:gap-6"
                >
                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {metrics && metrics.map((metric, i) => (
                            <m.div key={i} variants={item}>
                                <Card className="glass-card border-white/10 hover:border-primary/30 transition-all duration-300 group">
                                    <CardContent className="p-4 md:p-6">
                                        <div className="flex justify-between items-start">
                                            <div className={cn("p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors", metric.color)}>
                                                <metric.icon className="h-5 w-5" />
                                            </div>
                                            {/* Only show eye toggle for Total Revenue (amount) card */}
                                            {(metric.title === 'Total Revenue' || metric.title === 'Avg.\u00A0Order\u00A0Value' || metric.title === 'Avg. Order Value') ? (
                                                <button
                                                    onClick={() => setVisibleMetrics(prev => ({
                                                        ...prev,
                                                        [metric.title]: !prev[metric.title as keyof typeof prev]
                                                    }))}
                                                    className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border border-white/5 hover:border-white/20 hover:bg-white/5 transition-all"
                                                    aria-label={visibleMetrics[metric.title as keyof typeof visibleMetrics] ? 'Hide amount' : 'Show amount'}
                                                >
                                                    <m.span
                                                        initial={{ opacity: 0, y: -4 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        transition={{ duration: 0.18 }}
                                                    >
                                                        {visibleMetrics[metric.title as keyof typeof visibleMetrics] ? (
                                                            <Eye className="h-3 w-3" />
                                                        ) : (
                                                            <EyeOff className="h-3 w-3" />
                                                        )}
                                                    </m.span>
                                                </button>
                                            ) : (
                                                <div className="w-6" />
                                            )}
                                        </div>
                                        <div className="mt-4">
                                            <h3 className="text-xl md:text-2xl font-bold tracking-tight">
                                                {/* If this is the revenue card, respect visibility toggle. Other cards always show value. */}
                                                {(
                                                    metric.title === 'Total Revenue' ||
                                                    metric.title === 'Avg.\u00A0Order\u00A0Value' ||
                                                    metric.title === 'Avg. Order Value'
                                                )
                                                    ? (visibleMetrics[metric.title as keyof typeof visibleMetrics] ? metric.value : '••••')
                                                    : metric.value
                                                }
                                            </h3>
                                            <p className="text-sm text-muted-foreground mt-1">{metric.title}</p>
                                        </div>
                                        <div className={cn(
                                            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border border-white/5 mt-3 w-fit",
                                            metric.trend === 'up' ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                                        )}>
                                            {metric.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                            {metric.change}
                                        </div>
                                    </CardContent>
                                </Card>
                            </m.div>
                        ))}
                    </div>

                    {/* Main Chart Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                        <m.div variants={item} className="lg:col-span-2">
                            <Card className="glass-card border-white/10 h-full">
                                <CardHeader>
                                    <CardTitle>Revenue Trend</CardTitle>
                                    <CardDescription>Daily revenue performance ({timeRange === '7d' ? 'Last 7 Days' : timeRange === '30d' ? 'Last 30 Days' : 'Last 90 Days'})</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[250px] md:h-[300px] w-full">
                                        {chartData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={chartData}>
                                                    <defs>
                                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                                    <XAxis
                                                        dataKey="name"
                                                        stroke="#888888"
                                                        fontSize={12}
                                                        tickLine={false}
                                                        axisLine={false}
                                                    />
                                                    <YAxis
                                                        stroke="#888888"
                                                        fontSize={12}
                                                        tickLine={false}
                                                        axisLine={false}
                                                        tickFormatter={(value) => `₹${value / 1000}k`}
                                                        width={40}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: 'rgba(0,0,0,0.8)',
                                                            backdropFilter: 'blur(10px)',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            borderRadius: '12px',
                                                            color: '#fff'
                                                        }}
                                                        itemStyle={{ color: '#fff' }}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="value"
                                                        stroke="hsl(var(--primary))"
                                                        strokeWidth={3}
                                                        fillOpacity={1}
                                                        fill="url(#colorRevenue)"
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-muted-foreground">
                                                No revenue data available
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </m.div>

                        <m.div variants={item} className="lg:col-span-1">
                            <Card className="glass-card border-white/10 h-full">
                                <CardHeader>
                                    <CardTitle>Sales by Category</CardTitle>
                                    <CardDescription>Distribution across product types</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[200px] w-full relative">
                                        {categoryData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={categoryData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {categoryData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.5)" strokeWidth={2} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: 'rgba(0,0,0,0.8)',
                                                            backdropFilter: 'blur(10px)',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            borderRadius: '8px'
                                                        }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-muted-foreground">
                                                No category data
                                            </div>
                                        )}
                                        {categoryData.length > 0 && (
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="text-center">
                                                    <span className="text-2xl font-bold">100%</span>
                                                    <p className="text-xs text-muted-foreground">Total</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-6 space-y-3">
                                        {categoryData.map((item, i) => (
                                            <div key={i} className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                                    <span className="text-muted-foreground">{item.name}</span>
                                                </div>
                                                <span className="font-medium">{item.value}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </m.div>
                    </div>

                    {/* Bottom Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                        {/* Top Products */}
                        <m.div variants={item}>
                            <Card className="glass-card border-white/10 h-full">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Top Products</CardTitle>
                                        <CardDescription>Best selling items (by count)</CardDescription>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {topProductsList.length > 0 ? topProductsList.map((product, i) => (
                                        <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                                            <div className="h-10 w-10 min-w-[2.5rem] rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                {i + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between mb-1">
                                                    <span className="font-medium truncate">{product.name}</span>
                                                    <span className="font-bold">{product.revenue}</span>
                                                </div>
                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                    <span>{product.sales} sales</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-white/5 rounded-full mt-2 overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary/50 rounded-full group-hover:bg-primary transition-colors duration-500"
                                                        style={{ width: `${100 - (i * 15)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-8 text-muted-foreground">No product data available</div>
                                    )}
                                </CardContent>
                            </Card>
                        </m.div>

                        {/* Recent Transactions */}
                        <m.div variants={item}>
                            <Card className="glass-card border-white/10 h-full">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Recent Transactions</CardTitle>
                                        <CardDescription>Latest invoices generated</CardDescription>
                                    </div>
                                    <Button variant="outline" size="sm" className="h-8 text-xs border-white/10 hover:bg-white/5">
                                        View All
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {recentTxList.length > 0 ? recentTxList.map((tx, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/5 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                                        <Package className="h-5 w-5 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{tx.customer}</p>
                                                        <p className="text-xs text-muted-foreground">{tx.id} • {tx.date}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold">{tx.amount}</p>
                                                    <span className={cn(
                                                        "text-[10px] px-2 py-0.5 rounded-full border",
                                                        tx.status === 'Paid' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                                                            tx.status === 'Pending' ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                                                                "bg-red-500/10 border-red-500/20 text-red-400"
                                                    )}>
                                                        {tx.status}
                                                    </span>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="text-center py-8 text-muted-foreground">No recent transactions</div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </m.div>
                    </div>
                </m.div>
            </div>
        </LazyMotion>
    );
}
