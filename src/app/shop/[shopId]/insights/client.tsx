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
    RefreshCw,
    ArrowUpRight,
    ArrowDownRight,
    Sparkles,
    BarChart3,
    PieChart as PieChartIcon,
    Calendar as CalendarIcon
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
    Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency } from '@/lib/utils';
import type { Invoice } from '@/lib/definitions';
import { subDays, startOfDay, isWithinInterval, format } from 'date-fns';
import { SmartAIInsights } from '@/components/smart-ai-insights';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    const [activeTab, setActiveTab] = useState('overview');

    // --- Data Processing (Preserved Logic) ---
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

        const paidInvoices = invoices.filter(inv => inv.status === 'paid');

        const inRange = (d: Date, start: Date, end: Date) => isWithinInterval(d, { start, end });

        const currentPeriodInvoices = paidInvoices.filter(inv => inRange(new Date(inv.invoiceDate), currentPeriodStart, currentPeriodEnd));
        const previousPeriodInvoices = paidInvoices.filter(inv => inRange(new Date(inv.invoiceDate), previousPeriodStart, previousPeriodEnd));

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
            growth: 0
        };
        const prevAvgOrder = previousPeriodInvoices.length > 0 ? previousPeriodInvoices.reduce((a, b) => a + b.grandTotal, 0) / previousPeriodInvoices.length : 0;
        avgOrder.growth = prevAvgOrder === 0 ? (avgOrder.value > 0 ? 100 : 0) : ((avgOrder.value - prevAvgOrder) / prevAvgOrder) * 100;

        const currCustomers = new Set(currentPeriodInvoices.map(i => i.customerSnapshot?.phone || i.id)).size;
        const prevCustomers = new Set(previousPeriodInvoices.map(i => i.customerSnapshot?.phone || i.id)).size;
        const customerGrowth = prevCustomers === 0 ? (currCustomers > 0 ? 100 : 0) : ((currCustomers - prevCustomers) / prevCustomers) * 100;

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

        const catMap: Record<string, number> = {};
        invoiceItems.forEach(item => {
            const desc = (item.description || '').toLowerCase();
            const purity = (item.purity || '').toLowerCase();
            const type = item.metal_type || 'other';

            let label = 'Other';
            if (type === 'gold' || desc.includes('gold') || purity.includes('916')) label = 'Gold';
            else if (type === 'silver' || desc.includes('silver') || purity.includes('925')) label = 'Silver';
            else if (desc.includes('diamond')) label = 'Diamond';
            else if (desc.includes('platinum')) label = 'Platinum';

            const val = (Number(item.rate) * Number(item.net_weight)) + Number(item.making);
            catMap[label] = (catMap[label] || 0) + val;
        });
        const catData = Object.entries(catMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

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
                    color: 'text-amber-600 dark:text-amber-400',
                    bg: 'bg-amber-100 dark:bg-amber-900/40' // Gold/Amber theme
                },
                {
                    label: 'Total Orders',
                    value: sales.value,
                    growth: sales.growth,
                    icon: ShoppingBag,
                    color: 'text-primary',
                    bg: 'bg-primary/10'
                },
                {
                    label: 'Avg. Order Value',
                    value: formatCurrency(avgOrder.value),
                    growth: avgOrder.growth,
                    icon: CreditCard,
                    color: 'text-emerald-600 dark:text-emerald-400',
                    bg: 'bg-emerald-100 dark:bg-emerald-900/40'
                },
                {
                    label: 'Active Customers',
                    value: currCustomers,
                    growth: customerGrowth,
                    icon: Users,
                    color: 'text-blue-600 dark:text-blue-400',
                    bg: 'bg-blue-100 dark:bg-blue-900/40'
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

    // Gold-centric Colors
    const COLORS = ['#d97706', '#059669', '#2563eb', '#7c3aed', '#db2777'];

    return (
        <LazyMotion features={domAnimation}>
            <div className="min-h-screen bg-background pb-24 transition-colors duration-300">

                {/* --- HEADER SECTION (Strictly Matches Catalogue Premium Header) --- */}
                <div className="relative overflow-hidden bg-gradient-to-b from-muted/50 to-background border-b border-border transition-colors duration-300 pb-24 pt-10 md:pt-14 md:pb-32">
                    {/* Abstract Background Elements (Exactly like PremiumHeader) */}
                    <div className="absolute top-0 right-0 w-[250px] h-[250px] md:w-[500px] md:h-[500px] bg-primary/5 rounded-full blur-[80px] md:blur-[120px] -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-[150px] h-[150px] md:w-[300px] md:h-[300px] bg-primary/5 rounded-full blur-[60px] md:blur-[100px] translate-y-1/2 -translate-x-1/2" />

                    <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8">

                            {/* Brand Info */}
                            <div className="space-y-4 max-w-full md:max-w-2xl">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/10 backdrop-blur-md text-xs font-medium text-primary">
                                    <Sparkles className="h-3 w-3" />
                                    <span>Business Intelligence</span>
                                </div>

                                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
                                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary/70">
                                        Performance Overview
                                    </span>
                                </h1>

                                <p className="text-muted-foreground max-w-lg text-sm md:text-base leading-relaxed">
                                    Track your shop's growth, revenue trends, and inventory health in real-time.
                                </p>
                            </div>

                            {/* Actions & Filters - MOBILE OPTIMIZED */}
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                                {/* Time Range Pill */}
                                <div className="flex items-center p-1 rounded-full bg-card border border-border shadow-sm shrink-0">
                                    {['7d', '30d', '90d'].map((range) => (
                                        <button
                                            key={range}
                                            onClick={() => setTimeRange(range)}
                                            className={cn(
                                                "px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium rounded-full transition-all",
                                                timeRange === range
                                                    ? "bg-primary text-primary-foreground shadow-sm"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                            )}
                                        >
                                            {range === '7d' ? 'Week' : range === '30d' ? 'Month' : 'Quarter'}
                                        </button>
                                    ))}
                                </div>

                                <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={handleRefresh}
                                    className={cn("rounded-full h-9 w-9 md:h-11 md:w-11 shrink-0 bg-card border-border shadow-sm hover:bg-muted", isRefreshing && "animate-spin")}
                                >
                                    <RefreshCw className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- MAIN CONTENT CONTAINER (Overlapping Header) --- */}
                <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-20 relative z-20 space-y-6 md:space-y-8">

                    {/* AI Search Bar (Hero Placement) */}
                    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                        <SmartAIInsights shopId={shopId} className="w-full shadow-2xl shadow-primary/5 border-primary/10 bg-card/80 backdrop-blur-xl" />
                    </div>

                    {/* TABS Navigation */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 md:space-y-8">
                        <div className="flex justify-center md:justify-start animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                            <TabsList className="h-10 md:h-14 p-1 md:p-1.5 bg-background/80 backdrop-blur-xl border border-border shadow-xl shadow-black/5 rounded-full inline-flex">
                                {['overview', 'trends', 'products'].map((tab) => (
                                    <TabsTrigger
                                        key={tab}
                                        value={tab}
                                        className="rounded-full px-4 md:px-8 h-full text-xs md:text-sm font-medium capitalize data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all"
                                    >
                                        {tab}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        {/* OVERVIEW TAB */}
                        <TabsContent value="overview" className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 focus-visible:outline-none">

                            <m.div variants={container} initial="hidden" animate="show" className="space-y-6 md:space-y-8">
                                {/* Key Metrics Grid */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                                    {metrics.map((metric, i) => (
                                        <m.div key={i} variants={item}>
                                            <Card className="border-border/50 shadow-lg shadow-black/5 bg-card/60 backdrop-blur-xl hover:bg-card/90 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group">
                                                <CardContent className="p-4 md:p-6">
                                                    <div className="flex justify-between items-start mb-3 md:mb-4">
                                                        <div className={cn("p-2 md:p-3 rounded-xl transition-all duration-300 group-hover:scale-110 shadow-sm", metric.bg, metric.color)}>
                                                            <metric.icon className="w-4 h-4 md:w-6 md:h-6" />
                                                        </div>
                                                        {metric.growth !== 0 && (
                                                            <Badge variant="secondary" className={cn(
                                                                "px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-full text-[10px] font-semibold flex items-center gap-0.5 md:gap-1 border border-transparent transition-colors",
                                                                metric.growth > 0 ? "bg-emerald-500/10 text-emerald-600 group-hover:border-emerald-200" : "bg-red-500/10 text-red-600 group-hover:border-red-200"
                                                            )}>
                                                                {metric.growth > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                                                {Math.abs(metric.growth).toFixed(0)}%
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl sm:text-2xl md:text-4xl font-bold text-foreground tracking-tight truncate">
                                                            {metric.value}
                                                        </h3>
                                                        <p className="text-xs md:text-sm text-muted-foreground font-medium mt-1 truncate">{metric.label}</p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </m.div>
                                    ))}
                                </div>

                                {/* Charts & Analysis Block */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                                    {/* Main Revenue Chart */}
                                    <Card className="lg:col-span-2 border-border/50 shadow-xl shadow-black/5 bg-card/50 backdrop-blur-xl overflow-hidden">
                                        <CardHeader className="border-b border-border/30 bg-muted/20 px-4 md:px-6 py-4">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <CardTitle className="text-base md:text-lg font-bold flex items-center gap-2">
                                                        <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                                                        Revenue Analytics
                                                    </CardTitle>
                                                    <CardDescription className="text-xs md:text-sm">Daily revenue performance trend</CardDescription>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-primary animate-pulse" />
                                                            <span className="text-[10px] md:text-xs font-medium text-muted-foreground">Live Data</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-2 md:p-6">
                                            <div className="h-[250px] md:h-[350px] w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={revenueChartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                                        <defs>
                                                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                                                        <XAxis
                                                            dataKey="date"
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                                                            dy={10}
                                                            minTickGap={20}
                                                        />
                                                        <YAxis
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                                                            tickFormatter={formatCompactNumber}
                                                        />
                                                        <Tooltip
                                                            cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }}
                                                            contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--background)/0.95)', backdropFilter: 'blur(4px)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                            itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600, fontSize: '12px' }}
                                                        />
                                                        <Area
                                                            type="monotone"
                                                            dataKey="revenue"
                                                            stroke="hsl(var(--primary))"
                                                            strokeWidth={2}
                                                            fillOpacity={1}
                                                            fill="url(#colorRev)"
                                                            activeDot={{ r: 4, strokeWidth: 0, fill: "hsl(var(--primary))" }}
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Sales by Category */}
                                    <Card className="lg:col-span-1 border-border/50 shadow-xl shadow-black/5 bg-card/50 backdrop-blur-xl overflow-hidden flex flex-col">
                                        <CardHeader className="border-b border-border/30 bg-muted/20 pb-4">
                                            <CardTitle className="text-base md:text-lg font-bold flex items-center gap-2">
                                                <PieChartIcon className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
                                                Sales Mix
                                            </CardTitle>
                                            <CardDescription className="text-xs md:text-sm">Revenue by product type</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-4 md:p-6 flex flex-col items-center justify-center flex-1">
                                            <div className="h-[200px] md:h-[240px] w-full relative">
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
                                                            cornerRadius={6}
                                                            stroke="none"
                                                        >
                                                            {categoryData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip
                                                            formatter={(value: any) => formatCurrency(value)}
                                                            contentStyle={{ borderRadius: '12px', border: 'none', background: 'hsl(var(--popover))', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                                {/* Center Stats */}
                                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                    <span className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">{categoryData.length}</span>
                                                    <span className="text-[10px] text-primary uppercase tracking-widest font-bold mt-1">Types</span>
                                                </div>
                                            </div>
                                            <div className="w-full mt-4 md:mt-6 space-y-2 md:space-y-3">
                                                {categoryData.slice(0, 4).map((entry, index) => {
                                                    const total = categoryData.reduce((a, b) => a + b.value, 0);
                                                    const percent = total > 0 ? ((entry.value / total) * 100).toFixed(0) : 0;
                                                    return (
                                                        <div key={index} className="flex items-center justify-between text-xs md:text-sm group cursor-default p-1.5 md:p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                                            <div className="flex items-center gap-2 md:gap-3">
                                                                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                                                <span className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">{entry.name}</span>
                                                            </div>
                                                            <div className="font-bold tabular-nums">{percent}%</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </m.div>
                        </TabsContent>

                        {/* TRENDS TAB - Enhanced */}
                        <TabsContent value="trends" className="space-y-6 focus-visible:outline-none">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Detailed Chart */}
                                <Card className="md:col-span-2 border-border/50 shadow-xl shadow-black/5 bg-card/60 backdrop-blur-xl">
                                    <CardHeader>
                                        <CardTitle>Detailed Trend Analysis</CardTitle>
                                        <CardDescription>Comprehensive view of sales performance over time</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[300px] md:h-[500px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={revenueChartData}>
                                                    <defs>
                                                        <linearGradient id="colorRevBig" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} stroke="hsl(var(--border))" />
                                                    <XAxis dataKey="fullDate" minTickGap={50} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                                    <YAxis tickFormatter={formatCompactNumber} axisLine={false} tickLine={false} />
                                                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--popover))' }} />
                                                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#colorRevBig)" strokeWidth={3} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Peak Performance Card */}
                                <Card className="border-border/50 shadow-xl shadow-black/5 bg-gradient-to-br from-card/80 to-primary/5 backdrop-blur-xl">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-amber-500" /> Peak Performance
                                        </CardTitle>
                                        <CardDescription>Highest revenue days</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {[...revenueChartData].sort((a, b) => b.revenue - a.revenue).slice(0, 3).map((day, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border/50">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs", i === 0 ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground")}>
                                                            {i + 1}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold">{day.date}</p>
                                                            <p className="text-xs text-muted-foreground">{day.orders} orders</p>
                                                        </div>
                                                    </div>
                                                    <p className="font-bold text-primary">{formatCurrency(day.revenue)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* PRODUCTS TAB - Enhanced */}
                        <TabsContent value="products" className="space-y-6 focus-visible:outline-none">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Top Products List */}
                                <Card className="md:col-span-2 border-border/50 shadow-xl shadow-black/5 bg-card/60 backdrop-blur-xl">
                                    <CardHeader className="border-b border-border/30 bg-muted/20">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="flex items-center gap-2">
                                                    <ShoppingBag className="w-5 h-5 text-primary" /> Top Performing Inventory
                                                </CardTitle>
                                                <CardDescription>Ranked by revenue contribution</CardDescription>
                                            </div>
                                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                                {topProductsList.length} Items
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="divide-y divide-border/30">
                                            {topProductsList.map((product, i) => (
                                                <div key={i} className="flex items-center p-4 md:p-5 hover:bg-muted/30 transition-colors group">
                                                    <div className={cn(
                                                        "flex-shrink-0 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl font-bold text-sm shadow-sm transition-all duration-300",
                                                        i === 0 ? "bg-amber-100 text-amber-600 ring-4 ring-amber-50" :
                                                            i === 1 ? "bg-slate-100 text-slate-600" :
                                                                i === 2 ? "bg-orange-100 text-orange-700" :
                                                                    "bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                                                    )}>
                                                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                                                    </div>
                                                    <div className="ml-4 md:ml-6 flex-1">
                                                        <p className="text-sm md:text-base font-semibold text-foreground group-hover:text-primary transition-colors">{product.name}</p>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <Badge variant="secondary" className="text-[10px] px-1.5 h-5 bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary">
                                                                {product.count} Orders
                                                            </Badge>
                                                            {i === 0 && <Badge className="text-[10px] px-1.5 h-5 bg-amber-500 hover:bg-amber-600 border-0 text-white">Bestseller</Badge>}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm md:text-base font-bold text-foreground">{formatCurrency(product.revenue)}</p>
                                                        <span className="text-[10px] text-muted-foreground">Revenue</span>
                                                    </div>
                                                </div>
                                            ))}
                                            {topProductsList.length === 0 && <div className="p-10 text-center text-muted-foreground">No data available</div>}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </LazyMotion>
    );
}
