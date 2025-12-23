'use client';

import { useMemo } from 'react';
import {
    Bar,
    BarChart,
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
    Sparkles
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency } from '@/lib/utils';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';
import { m, LazyMotion, domAnimation } from 'framer-motion';

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
        <LazyMotion features={domAnimation}>
            <m.div
                dragConstraints={{ left: 0, right: 0 }}
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-8"
            >
                {/* Stats Cards - Bento Grid Style */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <StatsCard
                        title="Total Issued"
                        value={stats.totalIssued.toLocaleString()}
                        label="Points Distributed"
                        icon={TrendingUp}
                        className="bg-emerald-500/10 text-emerald-600"
                    />
                    <StatsCard
                        title="Redeemed"
                        value={stats.totalRedeemed.toLocaleString()}
                        label="Points Used"
                        icon={Gift}
                        className="bg-purple-500/10 text-purple-600"
                    />
                    <StatsCard
                        title="Active Members"
                        value={stats.totalCustomers.toLocaleString()}
                        label="Loyalty Users"
                        icon={Users}
                        className="bg-blue-500/10 text-blue-600"
                    />
                    <StatsCard
                        title="Liability"
                        value={formatCurrency(stats.liability)}
                        label="Outstanding Value"
                        icon={Zap}
                        className="bg-amber-500/10 text-amber-600"
                    />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

                    {/* Chart Section (2/3 width) - Modern Bar Chart */}
                    <Card className="lg:col-span-2 border-border/50 shadow-xl shadow-black/5 bg-card/60 backdrop-blur-xl overflow-hidden">
                        <CardHeader className="border-b border-border/30 bg-muted/20 pb-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-primary" />
                                        Points Velocity
                                    </CardTitle>
                                    <CardDescription>Points issued vs redeemed (30 Days)</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 md:p-6">
                            <div className="h-[300px] md:h-[350px] w-full pt-4 md:pt-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={2}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                                        <XAxis
                                            dataKey="dateStr"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                                            dy={10}
                                            minTickGap={30}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                                            tickFormatter={(val) => Intl.NumberFormat('en-US', { notation: "compact" }).format(val)}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'hsl(var(--muted)/0.2)', radius: 4 }}
                                            contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--background)/0.95)', backdropFilter: 'blur(4px)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600, fontSize: '12px' }}
                                        />
                                        <Bar
                                            dataKey="issued"
                                            name="Issued"
                                            fill="hsl(var(--primary))"
                                            radius={[4, 4, 0, 0]}
                                            maxBarSize={40}
                                        />
                                        <Bar
                                            dataKey="redeemed"
                                            name="Redeemed"
                                            fill="hsl(var(--destructive))"
                                            fillOpacity={0.8}
                                            radius={[4, 4, 0, 0]}
                                            maxBarSize={40}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Right Column Stack */}
                    <div className="space-y-6">
                        {/* Leaderboard Section */}
                        <Card className="border-border/50 shadow-xl shadow-black/5 bg-card/60 backdrop-blur-xl overflow-hidden">
                            <CardHeader className="border-b border-border/30 bg-muted/20">
                                <CardTitle className="flex items-center gap-2 text-base font-bold">
                                    <Crown className="h-4 w-4 text-amber-500" />
                                    Top Loyalists
                                </CardTitle>
                                <CardDescription>Highest balance holders</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-border/30">
                                    {topCustomers.map((customer, i) => (
                                        <div key={customer.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg font-bold text-xs shadow-sm transition-all duration-300",
                                                    i === 0 ? "bg-amber-100 text-amber-600 ring-2 ring-amber-50" :
                                                        i === 1 ? "bg-slate-100 text-slate-600" :
                                                            i === 2 ? "bg-orange-100 text-orange-700" :
                                                                "bg-primary/5 text-primary"
                                                )}>
                                                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{customer.name}</p>
                                                    <p className="text-xs text-muted-foreground">{customer.phone}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Badge variant="secondary" className="font-bold text-primary bg-primary/5 hover:bg-primary/10">
                                                    {customer.loyalty_points.toLocaleString()}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                    {topCustomers.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground text-sm">No data available</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Activity Mini List */}
                        <Card className="border-border/50 shadow-xl shadow-black/5 bg-card/60 backdrop-blur-xl overflow-hidden">
                            <CardHeader className="border-b border-border/30 bg-muted/20 pb-3">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <History className="h-4 w-4 text-muted-foreground" /> Recent Activity
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-border/30">
                                    {recentLogs.slice(0, 5).map((log, i) => (
                                        <div key={i} className="flex items-center justify-between p-3.5 hover:bg-muted/30 transition-colors text-sm">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-foreground">{log.customer?.name}</span>
                                                <span className="text-[10px] text-muted-foreground">{format(new Date(log.created_at), 'MMM d, h:mm a')}</span>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "font-mono font-bold border-0",
                                                    log.points_change > 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                                                )}
                                            >
                                                {log.points_change > 0 ? '+' : ''}{log.points_change}
                                            </Badge>
                                        </div>
                                    ))}
                                    {recentLogs.length === 0 && <div className="p-6 text-center text-xs text-muted-foreground">No recent activity</div>}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </m.div>
        </LazyMotion>
    );
}

function StatsCard({ title, value, label, icon: Icon, className }: any) {
    return (
        <m.div variants={item}>
            <Card className="border-border/50 shadow-lg shadow-black/5 bg-card/60 backdrop-blur-xl hover:bg-card/90 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group">
                <CardContent className="p-4 md:p-6">
                    <div className="flex justify-between items-start mb-3 md:mb-4">
                        <div className={cn("p-2 md:p-3 rounded-xl transition-all duration-300 group-hover:scale-110 shadow-sm", className)}>
                            <Icon className="w-4 h-4 md:w-6 md:h-6" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight truncate">
                            {value}
                        </h3>
                        <p className="text-xs md:text-sm text-muted-foreground font-medium mt-1 truncate">{label}</p>
                    </div>
                </CardContent>
            </Card>
        </m.div>
    );
}
