'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Eye, EyeOff, Zap, TrendingDown as TrendIcon } from 'lucide-react';
import { useState } from 'react';
import type { Invoice } from '@/lib/definitions';
import { formatCurrency } from '@/lib/utils';

interface SmartHeroProps {
    invoices: Invoice[] | null;
    totalRevenue: number;  // This Month
    totalWeekRevenue: number;  // This Week
    totalTodayRevenue: number;  // Today (Hero metric)
    revenueMoM: number | null;
}

export function SmartHero({ invoices, totalRevenue, totalWeekRevenue, totalTodayRevenue, revenueMoM }: SmartHeroProps) {
    const [isRevenueVisible, setIsRevenueVisible] = useState(false);
    const isPositiveTrend = (revenueMoM ?? 0) >= 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-background to-primary/5 border border-border shadow-gold-lg p-6 md:p-8"
        >
            {/* Decorative Background Elements */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.1, 0.15, 0.1]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-gold-200/30 to-transparent rounded-full blur-3xl -z-0"
            />
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.1, 0.2, 0.1]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-br from-blue-200/30 to-transparent rounded-full blur-3xl -z-0"
            />

            <div className="relative z-10">
                {/* Hero Metric - Today's Revenue */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-5 w-5 text-gold-500" />
                        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            Today's Revenue
                        </span>
                    </div>

                    <div className="flex items-baseline gap-3 mb-2">
                        <button
                            onClick={() => setIsRevenueVisible(!isRevenueVisible)}
                            className="flex items-baseline gap-2 hover:opacity-90 transition-opacity group"
                            aria-pressed={isRevenueVisible}
                            aria-label={isRevenueVisible ? 'Hide revenue' : 'Show revenue'}
                        >
                            <motion.h1
                                layout
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.25 }}
                                className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gold-500 via-gold-400 to-amber-500 bg-clip-text text-transparent font-mono"
                            >
                                {isRevenueVisible ? formatCurrency(totalTodayRevenue) : '••••••'}
                            </motion.h1>

                            <motion.span
                                key={isRevenueVisible ? 'visible' : 'hidden'}
                                initial={{ opacity: 0, rotate: -10, scale: 0.9 }}
                                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                                whileTap={{ scale: 0.95, rotate: -6 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                                className="inline-flex"
                            >
                                {isRevenueVisible ? (
                                    <Eye className="h-6 w-6 text-gold-500" />
                                ) : (
                                    <EyeOff className="h-6 w-6 text-muted-foreground" />
                                )}
                            </motion.span>
                        </button>
                    </div>

                    <p className="text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </span>
                    </p>
                </div>

                {/* Secondary Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* This Week */}
                    <div className="glass-card p-4 rounded-xl border border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                This Week
                            </span>
                        </div>
                        <div className="text-2xl font-bold text-foreground font-mono">
                            {isRevenueVisible ? formatCurrency(totalWeekRevenue) : '••••••'}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
                    </div>

                    {/* This Month */}
                    <div className="glass-card p-4 rounded-xl border border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="h-4 w-4 text-primary" />
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                This Month
                            </span>
                        </div>
                        <div className="text-2xl font-bold text-foreground font-mono">
                            {isRevenueVisible ? formatCurrency(totalRevenue) : '••••••'}
                        </div>
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${isPositiveTrend
                                ? 'bg-green-500/10 text-green-600'
                                : 'bg-red-500/10 text-red-600'
                                }`}
                        >
                            {isPositiveTrend ? (
                                <TrendingUp className="h-3 w-3" />
                            ) : (
                                <TrendingDown className="h-3 w-3" />
                            )}
                            <span>{Math.abs(revenueMoM ?? 0).toFixed(1)}% vs last month</span>
                        </motion.div>
                    </div>

                    {/* Total Invoices */}
                    <div className="glass-card p-4 rounded-xl border border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendIcon className="h-4 w-4 text-primary" />
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Total Invoices
                            </span>
                        </div>
                        <div className="text-2xl font-bold text-primary font-mono">
                            {invoices?.length || 0}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">All time</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
