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
        <Card className="h-full min-h-[400px] overflow-hidden relative flex flex-col border-2 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white dark:bg-gray-900">
            {/* Subtle gradient overlay - muted tones */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/8 via-transparent to-amber-500/8 pointer-events-none" />

            <CardHeader className="pb-3 border-b-2 border-gray-200 dark:border-gray-700 relative">
                <CardTitle className="text-lg font-heading font-bold text-[#1D1F23] dark:text-white flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-[#2AA198]/15 to-[#2AA198]/5 dark:from-[#2AA198]/20 dark:to-[#2AA198]/10 border border-[#2AA198]/20 dark:border-[#2AA198]/30">
                        <Activity className="w-4 h-4 text-[#2AA198] dark:text-[#2AA198]" />
                    </div>
                    Business Health
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-5 relative">
                {/* Profit Section */}
                <div className="space-y-3 p-4 rounded-2xl bg-gradient-to-br from-[#2AA198]/8 to-white dark:from-[#2AA198]/15 dark:to-slate-900/50 border border-[#2AA198]/20 dark:border-[#2AA198]/30">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground font-medium">Estimated Net Profit</p>
                        <span className="text-[10px] font-bold text-[#2AA198] bg-[#2AA198]/10 dark:bg-[#2AA198]/20 px-2.5 py-1 rounded-full border border-[#2AA198]/20 dark:border-[#2AA198]/30 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            ~20% Margin
                        </span>
                    </div>
                    <motion.h3
                        className="text-3xl font-bold text-[#1D1F23] dark:text-white font-heading tabular-nums"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        {formatCurrency(estimatedProfit)}
                    </motion.h3>
                    <div className="w-full h-2.5 bg-[#2AA198]/15 dark:bg-[#2AA198]/20 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '20%' }}
                            transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-[#2AA198] via-[#2AA198]/90 to-[#2AA198]/80 rounded-full shadow-sm shadow-[#2AA198]/30"
                        />
                    </div>
                </div>

                {/* Grid Metrics */}
                <div className="grid grid-cols-2 gap-3">
                    <motion.div
                        className="p-4 rounded-xl bg-gradient-to-br from-[#E8D6B8]/20 to-white dark:from-[#A5833A]/15 dark:to-slate-900/50 border border-[#CBB27A]/30 dark:border-[#A5833A]/30 space-y-2"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[#A5833A] dark:text-[#CBB27A]">
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
                                        className={`w-1 rounded-full ${i === 6 ? 'bg-[#A5833A]' : 'bg-[#CBB27A]/50'}`}
                                    />
                                ))}
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-[#1D1F23] dark:text-white tabular-nums">{totalOrders}</p>
                    </motion.div>

                    <motion.div
                        className="p-4 rounded-xl bg-gradient-to-br from-[#A08CD5]/10 to-white dark:from-[#A08CD5]/15 dark:to-slate-900/50 border border-[#A08CD5]/30 dark:border-[#A08CD5]/30 space-y-2"
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
                        <p className="text-2xl font-bold text-[#1D1F23] dark:text-white tabular-nums">{formatCurrency(aov)}</p>
                    </motion.div>
                </div>

                {/* Insight */}
                <motion.div
                    className={`flex items-start gap-3 p-4 rounded-xl border ${isPositive
                        ? 'bg-gradient-to-r from-[#2AA198]/8 to-white dark:from-[#2AA198]/15 dark:to-slate-900/50 border-[#2AA198]/20 dark:border-[#2AA198]/30'
                        : 'bg-gradient-to-r from-[#D97A5F]/10 to-white dark:from-[#D97A5F]/15 dark:to-slate-900/50 border-[#D97A5F]/30 dark:border-[#D97A5F]/30'
                        }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 }}
                >
                    <div className={`p-2 rounded-lg ${isPositive
                        ? 'bg-[#2AA198]/15 dark:bg-[#2AA198]/25'
                        : 'bg-[#D97A5F]/15 dark:bg-[#D97A5F]/25'
                        }`}>
                        {isPositive ? (
                            <TrendingUp className="w-4 h-4 text-[#2AA198]" />
                        ) : (
                            <TrendingDown className="w-4 h-4 text-[#D97A5F]" />
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-[#1D1F23] dark:text-white">
                            {isPositive ? "Growth on track 📈" : "Revenue dip 📉"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Revenue is {isPositive ? "up" : "down"} by <span className={`font-semibold ${isPositive ? 'text-[#2AA198]' : 'text-[#D97A5F]'}`}>{Math.abs(trendPercentage).toFixed(1)}%</span> compared to last period.
                        </p>
                    </div>
                </motion.div>
            </CardContent>
        </Card>
    );
}
