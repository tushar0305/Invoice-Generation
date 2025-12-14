'use client';

import { useState, useMemo, useEffect } from 'react';
import { m, LazyMotion, domAnimation, AnimatePresence } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingBag,
    Users,
    CreditCard,
    Calendar,
    RefreshCw,
    MoreHorizontal,
    Package,
    ArrowUpRight,
    ArrowDownRight,
    Filter,
    ChevronDown
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency } from '@/lib/utils';
import type { Invoice } from '@/lib/definitions';
import { subDays, startOfDay, isWithinInterval, format, parseISO } from 'date-fns';
import { SmartAIInsights } from '@/components/smart-ai-insights';
import { Badge } from '@/components/ui/badge';

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
    shopId: string;
}

// Compact Number Formatter
const formatCompactNumber = (number: number) => {
    return Intl.NumberFormat('en-IN', {
        notation: "compact",
        maximumFractionDigits: 1
    }).format(number);
};

export function InsightsClient({ invoices, invoiceItems, shopId }: InsightsClientProps) {
    const [timeRange, setTimeRange] = useState('30d');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // --- Data Processing ---
    const {
        metrics,
        revenueChartData,
        categoryData,
        topProductsList,
        recentTxList,
        salesTrend
    } = useMemo(() => {
        const now = new Date();
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;

        const currentPeriodStart = subDays(now, days);
        const currentPeriodEnd = now;
        const previousPeriodStart = subDays(currentPeriodStart, days);
        const previousPeriodEnd = currentPeriodStart;

        const paidInvoices = invoices.filter(inv => inv.status === 'paid'); // Only consider PAID for analytics except recent list

        // Helper
        const inRange = (d: Date, start: Date, end: Date) => isWithinInterval(d, { start, end });

        // Collections
        const currentPeriodInvoices = paidInvoices.filter(inv => inRange(new Date(inv.invoiceDate), currentPeriodStart, currentPeriodEnd));
        const previousPeriodInvoices = paidInvoices.filter(inv => inRange(new Date(inv.invoiceDate), previousPeriodStart, previousPeriodEnd));

        // Metrics Calculation
        const calcMetric = (current: any[], previous: any[], getValue: (i: any) => number) => {
            const currVal = current.reduce((sum, i) => sum + getValue(i), 0);
            const prevVal = previous.reduce((sum, i) => sum + getValue(i), 0);
            const growth = prevVal === 0 ? (currVal > 0 ? 100 : 0) : ((currVal - prevVal) / prevVal) * 100;
            return { value: currVal, growth };
        };

        const revenue = calcMetric(currentPeriodInvoices, previousPeriodInvoices, i => i.grandTotal);
        const sales = {
            value: currentPeriodInvoices.length,
            growth: previousPeriodInvoices.length === 0 ? (currentPeriodInvoices.length > 0 ? 100 : 0) : ((currentPeriodInvoices.length - previousPeriodInvoices.length) / previousPeriodInvoices.length) * 100
        };

        const avgOrder = {
            value: sales.value > 0 ? revenue.value / sales.value : 0,
            growth: 0 // Simplification
        };
        // Fix avg order growth properly
        const prevAvgOrder = previousPeriodInvoices.length > 0 ? previousPeriodInvoices.reduce((a, b) => a + b.grandTotal, 0) / previousPeriodInvoices.length : 0;
        avgOrder.growth = prevAvgOrder === 0 ? (avgOrder.value > 0 ? 100 : 0) : ((avgOrder.value - prevAvgOrder) / prevAvgOrder) * 100;

        // Unique Customers
        const currCustomers = new Set(currentPeriodInvoices.map(i => i.customerSnapshot?.phone || i.id)).size;
        const prevCustomers = new Set(previousPeriodInvoices.map(i => i.customerSnapshot?.phone || i.id)).size;
        const customerGrowth = prevCustomers === 0 ? (currCustomers > 0 ? 100 : 0) : ((currCustomers - prevCustomers) / prevCustomers) * 100;

        // Chart Data (Daily)
        const chartData = [];
        for (let i = days - 1; i >= 0; i--) {
            const date = subDays(now, i);
            const dayStart = startOfDay(date);
            const dayEnd = new Date(dayStart); dayEnd.setHours(23, 59, 59, 999);

            const dailyInvoices = paidInvoices.filter(inv => isWithinInterval(new Date(inv.invoiceDate), { start: dayStart, end: dayEnd }));
            const dailyRev = dailyInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

            chartData.push({
                date: format(date, 'MMM dd'),
                fullDate: format(date, 'yyyy-MM-dd'),
                revenue: dailyRev,
                orders: dailyInvoices.length
            });
        }

        // Category Data
        const catMap: Record<string, number> = {};
        invoiceItems.forEach(item => {
            // Basic category logic
            const desc = (item.description || '').toLowerCase();
            const purity = (item.purity || '').toLowerCase();
            const type = item.metal_type || 'other';

            let label = 'Other';
            if (type === 'gold' || desc.includes('gold') || purity.includes('916')) label = 'Gold';
            else if (type === 'silver' || desc.includes('silver') || purity.includes('925')) label = 'Silver';
            else if (desc.includes('diamond')) label = 'Diamond';
            else if (desc.includes('platinum')) label = 'Platinum';

            // Weighted by Revenue estimate (rate * weight + making)
            const val = (Number(item.rate) * Number(item.net_weight)) + Number(item.making);
            catMap[label] = (catMap[label] || 0) + val;
        });
        const catData = Object.entries(catMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // Top Products
        const prodMap: Record<string, { count: number, revenue: number }> = {};
        invoiceItems.forEach(item => {
            const name = item.description || 'Unknown';
            if (!prodMap[name]) prodMap[name] = { count: 0, revenue: 0 };
            prodMap[name].count += 1;
            prodMap[name].revenue += (Number(item.rate) * Number(item.net_weight)) + Number(item.making);
        });
        const topProds = Object.entries(prodMap)
            .map(([name, stats]) => ({ name, ...stats }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Recent Invoices (All statuses)
        const recent = invoices.slice(0, 6).map(inv => ({
            id: inv.invoiceNumber,
            customer: inv.customerSnapshot?.name || 'Walk-in Customer',
            amount: inv.grandTotal,
            status: inv.status,
            date: inv.invoiceDate
        }));

        return {
            metrics: [
                {
                    label: 'Total Revenue',
                    value: formatCurrency(revenue.value),
                    growth: revenue.growth,
                    icon: DollarSign,
                    color: 'text-emerald-500',
                    bg: 'bg-emerald-500/10'
                },
                {
                    label: 'Total Orders',
                    value: sales.value,
                    growth: sales.growth,
                    icon: ShoppingBag,
                    color: 'text-blue-500',
                    bg: 'bg-blue-500/10'
                },
                {
                    label: 'Avg. Order Value',
                    value: formatCurrency(avgOrder.value),
                    growth: avgOrder.growth,
                    icon: CreditCard,
                    color: 'text-violet-500',
                    bg: 'bg-violet-500/10'
                },
                {
                    label: 'Active Customers',
                    value: currCustomers,
                    growth: customerGrowth,
                    icon: Users,
                    color: 'text-amber-500',
                    bg: 'bg-amber-500/10'
                }
            ],
            revenueChartData: chartData,
            categoryData: catData,
            topProductsList: topProds,
            recentTxList: recent,
            salesTrend: revenue.growth >= 0 ? 'up' : 'down'
        };

    }, [invoices, invoiceItems, timeRange]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        window.location.reload();
    };

    const COLORS = ['#F59E0B', '#64748B', '#0EA5E9', '#A855F7', '#EF4444']; // Start with Gold (Amber)

    return (
        <LazyMotion features={domAnimation}>
            <div className="min-h-screen pb-24">

                {/* Header (Non-sticky, No Frame) */}
                <div className="pt-2 pb-0 md:pt-6 md:pb-2">
                    <div className="max-w-7xl mx-auto px-2 md:px-8">
                        <div className="flex items-center gap-3 md:gap-4">
                            {/* Segmented Control (Cleaner, no background frame) */}
                            <div className="flex-1 md:flex-none flex gap-2">
                                {['7d', '30d', '90d'].map((range) => (
                                    <button
                                        key={range}
                                        onClick={() => setTimeRange(range)}
                                        className={cn(
                                            "flex-1 md:flex-none px-3 md:px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all border",
                                            timeRange === range
                                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                                : "bg-transparent border-slate-200 dark:border-border text-slate-600 dark:text-muted-foreground hover:border-slate-300 dark:hover:border-slate-700"
                                        )}
                                    >
                                        {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '3 Months'}
                                    </button>
                                ))}
                            </div>

                            {/* Refresh Button */}
                            <button
                                onClick={handleRefresh}
                                className={cn(
                                    "p-2 rounded-lg border border-slate-200 dark:border-border text-slate-600 dark:text-muted-foreground hover:bg-slate-50 dark:hover:bg-muted transition-all"
                                )}
                            >
                                <RefreshCw className={cn("h-4 w-4 md:h-5 md:w-5", isRefreshing && "animate-spin")} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-2 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 md:space-y-8">
                    {/* AI Insights Section */}
                    <SmartAIInsights shopId={shopId} className="w-full" />

                    <m.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="space-y-6 md:space-y-8"
                    >
                        {/* Key Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                            {metrics.map((metric, i) => (
                                <m.div key={i} variants={item}>
                                    <Card className="border-border/60 shadow-sm hover:shadow-md transition-all duration-200">
                                        <CardContent className="p-4 md:p-6">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className={cn("p-2 rounded-lg", metric.bg, metric.color)}>
                                                    <metric.icon className="w-4 h-4 md:w-5 md:h-5" />
                                                </div>
                                                {metric.growth !== 0 && (
                                                    <div className={cn(
                                                        "flex items-center gap-0.5 text-[10px] md:text-xs font-bold px-1.5 py-0.5 rounded-full",
                                                        metric.growth > 0 ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" : "text-red-600 bg-red-50 dark:bg-red-900/20"
                                                    )}>
                                                        {metric.growth > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                                        {Math.abs(metric.growth).toFixed(0)}%
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">{metric.value}</h3>
                                                <p className="text-xs md:text-sm text-muted-foreground font-medium mt-0.5">{metric.label}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </m.div>
                            ))}
                        </div>

                        {/* Charts Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Revenue Chart */}
                            <m.div variants={item} className="lg:col-span-2">
                                <Card className="h-full border-border/60 shadow-sm">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base md:text-lg font-semibold flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-primary" />
                                            Revenue Trend
                                        </CardTitle>
                                        <CardDescription className="text-xs md:text-sm">
                                            Compare daily revenue over current period.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pl-0 pb-2">
                                        <div className="h-[250px] md:h-[300px] w-full">
                                            {revenueChartData.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={revenueChartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                                                        <defs>
                                                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                                                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                                                        <XAxis
                                                            dataKey="date"
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                                                            dy={10}
                                                            minTickGap={30}
                                                        />
                                                        <YAxis
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                                                            tickFormatter={formatCompactNumber}
                                                        />
                                                        <Tooltip
                                                            contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                                                            itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                                                        />
                                                        <Area
                                                            type="monotone"
                                                            dataKey="revenue"
                                                            stroke="hsl(var(--primary))"
                                                            strokeWidth={2}
                                                            fillOpacity={1}
                                                            fill="url(#colorRev)"
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No revenue data</div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </m.div>

                            {/* Category Pie */}
                            <m.div variants={item} className="lg:col-span-1">
                                <Card className="h-full border-border/60 shadow-sm">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base md:text-lg font-semibold">Sales Mix</CardTitle>
                                        <CardDescription className="text-xs md:text-sm">Revenue by Category</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[200px] md:h-[220px] w-full relative">
                                            {categoryData.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={categoryData}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={55}
                                                            outerRadius={75}
                                                            paddingAngle={4}
                                                            dataKey="value"
                                                        >
                                                            {categoryData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip
                                                            formatter={(value: any) => formatCurrency(value)}
                                                            contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No category data</div>
                                            )}
                                            {/* Center Text */}
                                            {categoryData.length > 0 && (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                    <span className="text-xl md:text-2xl font-bold">{categoryData.length}</span>
                                                    <span className="text-[10px] md:text-xs text-muted-foreground uppercase">Types</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-4 space-y-2">
                                            {categoryData.slice(0, 4).map((entry, index) => {
                                                const total = categoryData.reduce((a, b) => a + b.value, 0);
                                                const percent = ((entry.value / total) * 100).toFixed(0);
                                                return (
                                                    <div key={index} className="flex items-center justify-between text-xs md:text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                                            <span className="text-muted-foreground">{entry.name}</span>
                                                        </div>
                                                        <div className="font-medium">{percent}%</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            </m.div>
                        </div>

                        {/* Tables Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Top Products */}
                            <m.div variants={item}>
                                <Card className="h-full border-border/60 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-base md:text-lg font-semibold">Top Products</CardTitle>
                                        <CardDescription className="text-xs md:text-sm">Best sellers by volume</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="space-y-0">
                                            {topProductsList.map((product, i) => (
                                                <div key={i} className="flex items-center p-3 md:p-4 hover:bg-muted/40 transition-colors border-b last:border-0 border-border/50">
                                                    <div className="flex-shrink-0 w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs md:text-sm">
                                                        {i + 1}
                                                    </div>
                                                    <div className="ml-3 md:ml-4 flex-1 min-w-0">
                                                        <p className="text-xs md:text-sm font-medium truncate">{product.name}</p>
                                                        <p className="text-[10px] md:text-xs text-muted-foreground">{product.count} orders</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs md:text-sm font-semibold">{formatCurrency(product.revenue)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {topProductsList.length === 0 && (
                                                <div className="p-8 text-center text-muted-foreground text-sm">No products found</div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </m.div>

                            {/* Recent Invoices */}
                            <m.div variants={item}>
                                <Card className="h-full border-border/60 shadow-sm">
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle className="text-base md:text-lg font-semibold">Recent Invoices</CardTitle>
                                            <CardDescription className="text-xs md:text-sm">Latest transactions recorded</CardDescription>
                                        </div>
                                        <Button variant="outline" size="sm" className="h-7 text-[10px] md:text-xs">View All</Button>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="space-y-0">
                                            {recentTxList.map((tx, i) => (
                                                <div key={i} className="flex items-center p-3 md:p-4 hover:bg-muted/40 transition-colors border-b last:border-0 border-border/50">
                                                    <div className="flex-shrink-0 w-6 h-6 md:w-8 md:h-8 rounded-full bg-muted flex items-center justify-center">
                                                        <span className="text-[10px] md:text-xs font-semibold text-muted-foreground">
                                                            {tx.customer.substring(0, 1)}
                                                        </span>
                                                    </div>
                                                    <div className="ml-3 md:ml-4 flex-1 min-w-0">
                                                        <p className="text-xs md:text-sm font-medium truncate">{tx.customer}</p>
                                                        <p className="text-[10px] md:text-xs text-muted-foreground flex gap-1">
                                                            <span>{tx.id}</span>
                                                            <span>•</span>
                                                            <span>{format(new Date(tx.date), 'MMM dd')}</span>
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs md:text-sm font-bold">{formatCurrency(tx.amount)}</p>
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                "h-4 md:h-5 px-1 md:px-1.5 text-[10px] font-normal border-0 mt-0.5 md:mt-1",
                                                                tx.status === 'paid' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                                                    tx.status === 'due' ? "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
                                                                        "bg-slate-100 text-slate-600"
                                                            )}
                                                        >
                                                            {tx.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                            {recentTxList.length === 0 && (
                                                <div className="p-8 text-center text-muted-foreground text-sm">No transactions found</div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </m.div>
                        </div>
                    </m.div>
                </div>
            </div>
        </LazyMotion >
    );
}
