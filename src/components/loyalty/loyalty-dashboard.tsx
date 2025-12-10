'use client';

import { useMemo } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import {
    TrendingUp,
    Users,
    Crown,
    Gift,
    Zap,
    History,
    ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency } from '@/lib/utils';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';
import Link from 'next/link';

interface LoyaltyDashboardProps {
    shopId: string;
    stats: {
        totalIssued: number;
        totalRedeemed: number;
        liability: number;
        totalCustomers: number;
    };
    recentLogs: any[];
    topCustomers: any[];
    settings: any;
    allLogs: any[];
}

export function LoyaltyDashboard({ shopId, stats, recentLogs, topCustomers, settings, allLogs }: LoyaltyDashboardProps) {

    // Process data for Chart (Last 30 days)
    const chartData = useMemo(() => {
        const last30Days = Array.from({ length: 30 }).map((_, i) => {
            const date = subDays(new Date(), 29 - i);
            return {
                date: startOfDay(date),
                dateStr: format(date, 'MMM dd'),
                issued: 0,
                redeemed: 0
            };
        });

        allLogs.forEach(log => {
            const logDate = startOfDay(new Date(log.created_at));
            const dayData = last30Days.find(d => isSameDay(d.date, logDate));

            if (dayData) {
                if (log.points_change > 0) {
                    dayData.issued += log.points_change;
                } else {
                    dayData.redeemed += Math.abs(log.points_change);
                }
            }
        });

        return last30Days;
    }, [allLogs]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Loyalty Insights
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Track program performance and customer engagement
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button asChild variant="outline">
                        <Link href={`/shop/${shopId}/settings`}>
                            Configuration
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href={`/shop/${shopId}/invoices/new`}>
                            New Invoice
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats Cards - Clean & Professional */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Total Issued"
                    value={stats.totalIssued.toLocaleString()}
                    label="pts"
                    icon={<TrendingUp className="h-4 w-4" />}
                />
                <StatsCard
                    title="Redeemed"
                    value={stats.totalRedeemed.toLocaleString()}
                    label="pts"
                    icon={<Gift className="h-4 w-4" />}
                />
                <StatsCard
                    title="Active Members"
                    value={stats.totalCustomers.toLocaleString()}
                    label="users"
                    icon={<Users className="h-4 w-4" />}
                />
                <StatsCard
                    title="Liability"
                    value={formatCurrency(stats.liability)}
                    label="value"
                    icon={<Zap className="h-4 w-4" />}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Chart Section (2/3 width) */}
                <Card className="lg:col-span-2 shadow-sm border border-border bg-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            Points Velocity
                        </CardTitle>
                        <CardDescription>
                            Points issued vs redeemed over the last 30 days
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorIssued" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                                    <XAxis
                                        dataKey="dateStr"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                        dy={10}
                                        minTickGap={30}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="issued"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorIssued)"
                                        name="Points Issued"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="redeemed"
                                        stroke="hsl(var(--destructive))"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="transparent"
                                        name="Points Redeemed"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Leaderboard Section (1/3 width) */}
                <div className="space-y-6">
                    <Card className="shadow-sm border border-border bg-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <Crown className="h-4 w-4 text-amber-500" />
                                Top Loyalists
                            </CardTitle>
                            <CardDescription>Highest point balance holders</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {topCustomers.map((customer, i) => (
                                <div key={customer.id} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "flex items-center justify-center w-7 h-7 rounded-full font-bold text-xs ring-1",
                                            i === 0 ? "bg-amber-100 text-amber-700 ring-amber-200" :
                                                i === 1 ? "bg-slate-100 text-slate-700 ring-slate-200" :
                                                    i === 2 ? "bg-orange-100 text-orange-700 ring-orange-200" :
                                                        "bg-slate-50 text-slate-500 ring-slate-100"
                                        )}>
                                            {i + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm text-foreground">{customer.name}</p>
                                            <p className="text-xs text-muted-foreground">{customer.phone}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-sm text-primary">{customer.loyalty_points}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Points</p>
                                    </div>
                                </div>
                            ))}
                            {topCustomers.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">No data available</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Activity Mini List */}
                    <Card className="shadow-sm border border-border bg-card">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <History className="h-4 w-4 text-muted-foreground" /> Recent Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {recentLogs.slice(0, 5).map((log, i) => {
                                const created = new Date(log.created_at);
                                const validityDays = settings?.points_validity_days || 0;
                                const expiry = validityDays > 0 ? new Date(created.getTime() + validityDays * 24 * 60 * 60 * 1000) : null;
                                return (
                                    <div key={i} className="grid grid-cols-2 md:grid-cols-3 items-center gap-2 text-sm py-2 border-b last:border-0 border-border/50">
                                        <span className="text-foreground font-medium truncate">
                                            {log.customer?.name}
                                        </span>
                                        <span className={cn(
                                            "font-mono font-medium justify-self-end",
                                            log.points_change > 0 ? "text-emerald-600" : "text-rose-600"
                                        )}>
                                            {log.points_change > 0 ? '+' : ''}{log.points_change}
                                        </span>
                                        <span className="hidden md:block text-xs text-muted-foreground justify-self-end">
                                            {expiry ? `Expires ${format(expiry, 'MMM d, yyyy')}` : 'No expiry'}
                                        </span>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}

function StatsCard({ title, value, label, icon }: any) {
    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow border border-border bg-card">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <div className="flex items-baseline gap-1 mt-1">
                        <h3 className="text-2xl font-bold tracking-tight text-foreground">{value}</h3>
                        <span className="text-xs text-muted-foreground">{label}</span>
                    </div>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    {icon}
                </div>
            </CardContent>
        </Card>
    );
}
