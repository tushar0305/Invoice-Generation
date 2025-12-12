'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Activity, Sparkles } from 'lucide-react';
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
        <Card className="h-full min-h-[400px] overflow-hidden relative flex flex-col bg-card border border-border shadow-sm hover:shadow-md transition-all duration-300">
            {/* Subtle gradient overlay - muted tones */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-amber-500/5 pointer-events-none" />

            <CardHeader className="pb-3 border-b border-border relative">
                <CardTitle className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <Activity className="w-4 h-4 text-emerald-500" />
                    </div>
                    Business Health
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-5 relative">
                {/* Profit Section */}
                <div className="space-y-3 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground font-medium">Estimated Net Profit</p>
                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            ~20% Margin
                        </span>
                    </div>
                    <motion.h3
                        className="text-3xl font-bold text-foreground font-heading tabular-nums glow-text-primary"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        {formatCurrency(estimatedProfit)}
                    </motion.h3>
                    <div className="w-full h-2.5 bg-emerald-500/10 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '20%' }}
                            transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                        />
                    </div>
                </div>

                {/* Grid Metrics */}
                <div className="grid grid-cols-2 gap-3">
                    <motion.div
                        className="p-4 rounded-xl bg-muted/50 border border-border space-y-2 hover:bg-muted transition-colors"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-amber-500">
                                <ShoppingBag className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Orders</span>
                            </div>
                            {/* Desktop mini sparkline */}
                            <div className="hidden lg:flex items-end gap-0.5 h-4">
                                {[35, 50, 40, 65, 55, 80, 70].map((h, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ height: 0 }}
                                        animate={{ height: `${h}%` }}
                                        transition={{ delay: 0.5 + i * 0.05, duration: 0.25 }}
                                        className={`w-1 rounded-full ${i === 6 ? 'bg-amber-500' : 'bg-amber-500/30'}`}
                                    />
                                ))}
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-foreground tabular-nums">{totalOrders}</p>
                    </motion.div>

                    <motion.div
                        className="p-4 rounded-xl bg-muted/50 border border-border space-y-2 hover:bg-muted transition-colors"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.4 }}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[#A08CD5]">
                                <DollarSign className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Avg. Order</span>
                            </div>
                            {/* Desktop mini donut */}
                            <div className="hidden lg:block w-6 h-6 rounded-full bg-gradient-to-r from-[#A08CD5] to-[#A08CD5]/80 relative">
                                <div className="absolute inset-1 rounded-full bg-gradient-to-br from-[#A08CD5]/10 to-white dark:from-[#A08CD5]/20 dark:to-slate-900" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-foreground tabular-nums">{formatCurrency(aov)}</p>
                    </motion.div>
                </div>

                {/* Insight */}
                <motion.div
                    className={`flex items-start gap-3 p-4 rounded-xl border ${isPositive
                        ? 'bg-gradient-to-r from-emerald-500/5 to-card border-emerald-500/20'
                        : 'bg-gradient-to-r from-destructive/5 to-card border-destructive/20'
                        }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 }}
                >
                    <div className={`p-2 rounded-lg ${isPositive
                        ? 'bg-emerald-500/10'
                        : 'bg-destructive/10'
                        }`}>
                        {isPositive ? (
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                        ) : (
                            <TrendingDown className="w-4 h-4 text-destructive" />
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground">
                            {isPositive ? "Growth on track 📈" : "Revenue dip 📉"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Revenue is {isPositive ? "up" : "down"} by <span className={`font-semibold ${isPositive ? 'text-emerald-500' : 'text-destructive'}`}>{Math.abs(trendPercentage).toFixed(1)}%</span> compared to last period.
                        </p>
                    </div>
                </motion.div>
            </CardContent>
        </Card>
    );
}
