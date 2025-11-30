'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface BusinessHealthProps {
    totalRevenue: number;
    totalOrders: number;
    previousRevenue: number; // For trend calculation
}

export function BusinessHealthWidget({ totalRevenue, totalOrders, previousRevenue }: BusinessHealthProps) {
    // Calculate Metrics
    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Estimated Profit (Assuming ~20% margin for jewellery retail as a baseline placeholder)
    // In a real app, this would be calculated from cost price.
    const estimatedProfit = totalRevenue * 0.20;

    // Trend
    const isPositive = totalRevenue >= previousRevenue;
    const trendPercentage = previousRevenue > 0
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
        : 100;

    return (
        <Card className="glass-panel border-gold-500/10 h-full">
            <CardHeader className="pb-2 border-b border-gold-500/5">
                <CardTitle className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
                    <Activity className="w-5 h-5 text-gold-500" />
                    Business Health
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                {/* Profit Section */}
                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">Estimated Net Profit</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold text-foreground font-heading">
                            {formatCurrency(estimatedProfit)}
                        </h3>
                        <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            ~20% Margin
                        </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '20%' }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                        />
                    </div>
                </div>

                {/* Grid Metrics */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-gold-500/5 border border-gold-500/10 space-y-1">
                        <div className="flex items-center gap-2 text-gold-600 dark:text-gold-400">
                            <ShoppingBag className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Orders</span>
                        </div>
                        <p className="text-xl font-bold text-foreground">{totalOrders}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 space-y-1">
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                            <DollarSign className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Avg. Order</span>
                        </div>
                        <p className="text-xl font-bold text-foreground">{formatCurrency(aov)}</p>
                    </div>
                </div>

                {/* Insight */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                    {isPositive ? (
                        <TrendingUp className="w-5 h-5 text-emerald-500 mt-0.5" />
                    ) : (
                        <TrendingDown className="w-5 h-5 text-red-500 mt-0.5" />
                    )}
                    <div>
                        <p className="text-sm font-medium text-foreground">
                            {isPositive ? "Growth on track" : "Revenue dip"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Revenue is {isPositive ? "up" : "down"} by {Math.abs(trendPercentage).toFixed(1)}% compared to last period.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
