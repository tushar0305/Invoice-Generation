'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Calendar, Eye, EyeOff, Sparkles, ArrowUpRight, Zap } from 'lucide-react';
import { useState } from 'react';
import type { Invoice } from '@/lib/definitions';
import { formatCurrency } from '@/lib/utils';
import { ClientDate } from './client-date';

interface SmartHeroProps {
    invoices: Invoice[] | null;
    totalRevenue: number;  // This Month
    totalWeekRevenue: number;  // This Week
    totalTodayRevenue: number;  // Today (Hero metric)
    revenueMoM: number | null;
}

export function SmartHero({ totalTodayRevenue, totalWeekRevenue, totalRevenue, revenueMoM }: SmartHeroProps) {
    const [isRevenueVisible, setIsRevenueVisible] = useState(false);
    const isPositiveTrend = (revenueMoM ?? 0) >= 0;

    // Calculate daily average for desktop insights
    const dailyAvg = totalWeekRevenue / 7;
    const vsYesterday = totalTodayRevenue > 0 ? ((totalTodayRevenue - dailyAvg) / dailyAvg * 100) : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative overflow-hidden rounded-[18px] lg:rounded-[20px] px-5 py-4 lg:px-8 lg:py-6 shadow-md lg:shadow-lg border-2 w-full
                bg-gradient-to-br from-card via-card/95 to-muted/50
                border-border
                hover:shadow-xl transition-shadow duration-300"
            style={{ minHeight: '90px' }}
        >
            {/* Subtle decorative background - Muted champagne, not bright gold */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
            <div className="absolute top-0 right-0 w-32 lg:w-48 h-32 lg:h-48 bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-2xl" />

            {/* Desktop: Soft champagne radial highlight */}
            <div className="hidden lg:block absolute -left-20 top-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-primary/5 via-primary/5 to-transparent rounded-full blur-3xl" />

            <div className="relative z-10 flex items-center justify-between h-full">
                {/* Left: Revenue Info */}
                <div className="flex flex-col justify-center">
                    {/* Date line with performance dots */}
                    <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-3 w-3 text-primary/70" />
                        <span className="text-[11px] font-medium text-primary/80 uppercase tracking-wide">
                            <ClientDate />
                        </span>
                        {/* Performance indicator dots */}
                        <div className="flex items-center gap-0.5 ml-1">
                            {[...Array(3)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.3 + i * 0.1, type: "spring", stiffness: 500 }}
                                    className={`w-1.5 h-1.5 rounded-full ${isPositiveTrend
                                        ? 'bg-emerald-500'
                                        : i < 2 ? 'bg-primary' : 'bg-destructive'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-sm lg:text-base font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-primary" />
                        Today's Revenue
                    </h2>

                    {/* Main Revenue Display */}
                    <div className="flex items-baseline gap-2.5 lg:gap-4">
                        <button
                            onClick={() => setIsRevenueVisible(!isRevenueVisible)}
                            className="flex items-baseline gap-1 hover:opacity-90 transition-opacity"
                            aria-pressed={isRevenueVisible}
                            aria-label={isRevenueVisible ? 'Hide revenue' : 'Show revenue'}
                        >
                            <motion.span
                                layout
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2 }}
                                className="text-2xl md:text-3xl lg:text-4xl font-bold font-heading tracking-tight text-foreground"
                            >
                                {isRevenueVisible ? formatCurrency(totalTodayRevenue) : '₹••••••'}
                            </motion.span>
                        </button>

                        {/* Growth pill - Muted teal for positive */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.15 }}
                            className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] lg:text-xs font-semibold ${isPositiveTrend
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/20'
                                : 'bg-destructive/10 text-destructive dark:bg-destructive/20'
                                }`}
                        >
                            {isPositiveTrend ? (
                                <TrendingUp className="h-2.5 w-2.5 lg:h-3 lg:w-3" />
                            ) : (
                                <TrendingDown className="h-2.5 w-2.5 lg:h-3 lg:w-3" />
                            )}
                            <span>{Math.abs(revenueMoM ?? 0).toFixed(1)}%</span>
                        </motion.div>
                    </div>
                </div>

                {/* Desktop Only: Additional Insights */}
                <div className="hidden lg:flex items-center gap-16 xl:gap-24">
                    {/* Daily Comparison */}
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">vs Daily Avg</span>
                        <div className={`flex items-center gap-1 text-sm font-bold ${vsYesterday >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                            {vsYesterday >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                            {isRevenueVisible ? `${vsYesterday >= 0 ? '+' : ''}${vsYesterday.toFixed(1)}%` : '••%'}
                        </div>
                    </div>

                    {/* Mini Sparkline - Muted gold bars */}
                    <div className="flex flex-col items-center gap-1">
                        <div className="flex items-end gap-0.5 h-8">
                            {[40, 65, 45, 80, 60, 90, 75].map((h, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h}%` }}
                                    transition={{ delay: 0.5 + i * 0.05, duration: 0.3 }}
                                    className={`w-1.5 rounded-full ${i === 6 ? 'bg-primary' : 'bg-primary/40 dark:bg-primary/30'}`}
                                />
                            ))}
                        </div>
                        <span className="text-[9px] text-muted-foreground">7-day trend</span>
                    </div>

                    {/* Week Progress */}
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5 flex items-center gap-1">
                            <Zap className="h-2.5 w-2.5 text-primary" />
                            Week Progress
                        </span>
                        <span className="text-sm font-bold text-foreground">
                            {isRevenueVisible ? formatCurrency(totalWeekRevenue) : '₹••••'}
                        </span>
                    </div>
                </div>

                {/* Right: Eye toggle button - flush right */}
                <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setIsRevenueVisible(!isRevenueVisible)}
                    className="p-2.5 rounded-full bg-background/70 dark:bg-background/10 hover:bg-background/90 dark:hover:bg-background/20 transition-all duration-200 shadow-sm border border-border ml-4"
                    aria-label={isRevenueVisible ? "Hide revenue" : "Show revenue"}
                >
                    <motion.span
                        key={isRevenueVisible ? 'visible' : 'hidden'}
                        initial={{ opacity: 0, rotate: -10, scale: 0.9 }}
                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                    >
                        {isRevenueVisible ? (
                            <Eye className="h-4 w-4 text-primary" />
                        ) : (
                            <EyeOff className="h-4 w-4 text-primary/60" />
                        )}
                    </motion.span>
                </motion.button>
            </div>
        </motion.div>
    );
}
